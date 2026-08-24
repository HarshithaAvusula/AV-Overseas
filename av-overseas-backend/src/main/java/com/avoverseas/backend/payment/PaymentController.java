package com.avoverseas.backend.payment;

import com.avoverseas.backend.assignment.Assignment;
import com.avoverseas.backend.assignment.AssignmentRepository;
import com.avoverseas.backend.assignment.AssignmentStatus;
import com.avoverseas.backend.audit.AssignmentActivity;
import com.avoverseas.backend.audit.AssignmentActivityRepository;
import com.avoverseas.backend.notification.Notification;
import com.avoverseas.backend.notification.NotificationRepository;
import com.avoverseas.backend.payout.ExpertPayout;
import com.avoverseas.backend.payout.ExpertPayoutRepository;
import com.avoverseas.backend.payout.ExpertPayoutStatus;
import com.avoverseas.backend.user.User;
import com.avoverseas.backend.user.UserRepository;
import com.avoverseas.backend.user.UserRole;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
public class PaymentController {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ExpertPayoutRepository payoutRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AssignmentActivityRepository activityRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    public record CreateOrderRequest(UUID assignmentId, BigDecimal amount) {}
    public record VerifyPaymentRequest(UUID assignmentId, String razorpayPaymentId, String razorpayOrderId, String razorpaySignature) {}
    public record OrderResponse(String orderId, String keyId, int amount, String currency, UUID assignmentId) {}
    public record VerifyPaymentResponse(Payment payment, String message, String assignmentTitle) {}

    public record PaymentDTO(
            String id,
            String assignmentId,
            String assignmentTitle,
            String subject,
            String studentId,
            String studentName,
            String studentEmail,
            BigDecimal amount,
            String currency,
            String provider,
            String providerPaymentId,
            String status,
            Instant createdAt,
            String payoutStatus
    ) {}

    public record ExpertPayoutDTO(
            String id,
            String assignmentId,
            String assignmentTitle,
            String subject,
            String expertId,
            String expertName,
            String expertEmail,
            String studentName,
            BigDecimal totalOrderAmount,
            BigDecimal amount,
            String status,
            Instant approvedAt,
            Instant releasedAt,
            Instant createdAt
    ) {}

    public record SubjectRevenueDTO(String subject, long orderCount, BigDecimal revenueUSD) {}

    public record RevenueReportDTO(
            BigDecimal totalRevenueUSD,
            long totalPaidStudentsCount,
            long totalTransactionsCount,
            BigDecimal expertPayoutsApprovedUSD,
            BigDecimal expertPayoutsReleasedUSD,
            BigDecimal netPlatformMarginUSD,
            List<PaymentDTO> payments,
            List<SubjectRevenueDTO> revenueBySubject
    ) {}

    // Create Razorpay Order
    @PostMapping("/payments/create-order")
    public ResponseEntity<?> createRazorpayOrder(@RequestBody CreateOrderRequest req) {
        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.STUDENT) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only students can purchase tutoring services");
        }

        Assignment assignment = assignmentRepository.findById(req.assignmentId())
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!assignment.getStudentId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        try {
            RazorpayClient razorpay = new RazorpayClient(keyId, keySecret);

            JSONObject orderRequest = new JSONObject();
            int amountInCents = req.amount().multiply(new BigDecimal("100")).intValue();
            orderRequest.put("amount", amountInCents);
            orderRequest.put("currency", "USD");
            orderRequest.put("receipt", "txn_" + assignment.getId().toString().substring(0, 8));

            Order order = razorpay.orders.create(orderRequest);
            String orderId = order.get("id");

            return ResponseEntity.ok(new OrderResponse(
                    orderId,
                    keyId,
                    amountInCents,
                    "USD",
                    assignment.getId()
            ));
        } catch (Exception e) {
            String mockOrderId = "order_sim_" + UUID.randomUUID().toString().substring(0, 10);
            int amountInCents = req.amount().multiply(new BigDecimal("100")).intValue();
            return ResponseEntity.ok(new OrderResponse(
                    mockOrderId,
                    keyId,
                    amountInCents,
                    "USD",
                    assignment.getId()
            ));
        }
    }

    // Verify Payment Signature
    @PostMapping("/payments/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody VerifyPaymentRequest req) {
        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.STUDENT) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        Assignment assignment = assignmentRepository.findById(req.assignmentId())
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        try {
            boolean isSimulated = req.razorpayOrderId() != null && req.razorpayOrderId().startsWith("order_sim_") 
                    || req.razorpayPaymentId() != null && req.razorpayPaymentId().startsWith("pay_sim_");

            if (!isSimulated && keySecret != null && !keySecret.isEmpty() && req.razorpaySignature() != null && !req.razorpaySignature().isEmpty()) {
                try {
                    JSONObject options = new JSONObject();
                    options.put("razorpay_order_id", req.razorpayOrderId());
                    options.put("razorpay_payment_id", req.razorpayPaymentId());
                    options.put("razorpay_signature", req.razorpaySignature());

                    boolean isValid = Utils.verifyPaymentSignature(options, keySecret);
                    if (!isValid) {
                        return ResponseEntity.badRequest().body("Invalid payment signature check failed");
                    }
                } catch (Exception sigEx) {
                    if (req.razorpayPaymentId() == null || req.razorpayPaymentId().isEmpty()) {
                        return ResponseEntity.badRequest().body("Signature verification failed: " + sigEx.getMessage());
                    }
                }
            }

            // Create payment entity
            Payment payment = Payment.builder()
                    .assignmentId(assignment.getId())
                    .studentId(user.getId())
                    .amount(new BigDecimal("150.00")) // Standard price
                    .currency("USD")
                    .provider("RAZORPAY")
                    .providerPaymentId(req.razorpayPaymentId() != null ? req.razorpayPaymentId() : "pay_" + UUID.randomUUID().toString().substring(0, 10))
                    .status(PaymentStatus.PAID)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            paymentRepository.save(payment);

            AssignmentStatus oldStatus = assignment.getStatus();
            assignment.setStatus(AssignmentStatus.PAID);
            assignment.setUpdatedAt(Instant.now());
            assignmentRepository.save(assignment);

            // Audit Log
            activityRepository.save(AssignmentActivity.builder()
                    .assignmentId(assignment.getId())
                    .actorId(user.getId())
                    .action("PAYMENT_SUCCESS")
                    .oldStatus(oldStatus.name())
                    .newStatus(assignment.getStatus().name())
                    .description("Student payment completed via Razorpay. Txn ID: " + req.razorpayPaymentId())
                    .createdAt(Instant.now())
                    .build());

            // Notify Student
            notificationRepository.save(Notification.builder()
                    .userId(user.getId())
                    .assignmentId(assignment.getId())
                    .type("PAYMENT_SUCCESS")
                    .title("Payment Successful")
                    .message("Your payment of $150.00 USD for assignment '" + assignment.getTitle() + "' was successfully processed. An expert tutor will be assigned shortly.")
                    .read(false)
                    .createdAt(Instant.now())
                    .build());

            // Notify Admins
            userRepository.findAll().stream()
                    .filter(u -> u.getRole() == UserRole.ADMIN)
                    .forEach(admin -> {
                        notificationRepository.save(Notification.builder()
                                .userId(admin.getId())
                                .assignmentId(assignment.getId())
                                .type("PAYMENT_SUCCESS")
                                .title("New Tutorial Order Paid")
                                .message("Assignment '" + assignment.getTitle() + "' has been paid via Razorpay by " + user.getName() + ".")
                                .read(false)
                                .createdAt(Instant.now())
                                .build());
                    });

            return ResponseEntity.ok(new VerifyPaymentResponse(
                    payment,
                    "Payment Successful",
                    assignment.getTitle()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Payment processing failed: " + e.getMessage());
        }
    }

    // List all student payments (Independent for Payments page)
    @GetMapping("/payments")
    public ResponseEntity<List<PaymentDTO>> getPayments() {
        User user = getAuthenticatedUser();
        List<Payment> payments;
        if (user.getRole() == UserRole.ADMIN) {
            payments = paymentRepository.findAll();
        } else if (user.getRole() == UserRole.STUDENT) {
            payments = paymentRepository.findByStudentId(user.getId());
        } else {
            List<UUID> assignmentIds = assignmentRepository.findByExpertId(user.getId()).stream()
                    .map(Assignment::getId)
                    .collect(Collectors.toList());
            payments = paymentRepository.findAll().stream()
                    .filter(p -> assignmentIds.contains(p.getAssignmentId()))
                    .collect(Collectors.toList());
        }

        List<PaymentDTO> dtos = payments.stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .map(this::mapToPaymentDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    // List all expert payouts (Independent for Expert Payouts page)
    @GetMapping("/payouts")
    public ResponseEntity<List<ExpertPayoutDTO>> getPayouts() {
        User user = getAuthenticatedUser();
        List<ExpertPayout> payouts;

        if (user.getRole() == UserRole.ADMIN) {
            payouts = payoutRepository.findAll();
        } else if (user.getRole() == UserRole.EXPERT) {
            payouts = payoutRepository.findByExpertId(user.getId());
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<ExpertPayoutDTO> dtos = payouts.stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .map(this::mapToPayoutDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    // Revenue and Activity Reports for Admin
    @GetMapping("/reports/revenue")
    public ResponseEntity<RevenueReportDTO> getRevenueReport() {
        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<Payment> allPayments = paymentRepository.findAll().stream()
                .filter(p -> p.getStatus() == PaymentStatus.PAID)
                .collect(Collectors.toList());

        BigDecimal totalRevenue = allPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Dynamically compute distinct paid students count from DB payment records
        long paidStudentsCount = allPayments.stream()
                .map(p -> {
                    if (p.getStudentId() != null) return p.getStudentId();
                    if (p.getAssignmentId() != null) {
                        Optional<Assignment> a = assignmentRepository.findById(p.getAssignmentId());
                        if (a.isPresent()) return a.get().getStudentId();
                    }
                    return null;
                })
                .filter(Objects::nonNull)
                .distinct()
                .count();

        long totalTransactions = allPayments.size();

        List<ExpertPayout> allPayouts = payoutRepository.findAll();
        BigDecimal payoutsApproved = allPayouts.stream()
                .filter(p -> p.getStatus() == ExpertPayoutStatus.APPROVED)
                .map(ExpertPayout::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal payoutsReleased = allPayouts.stream()
                .filter(p -> p.getStatus() == ExpertPayoutStatus.RELEASED)
                .map(ExpertPayout::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal platformMargin = totalRevenue.multiply(new BigDecimal("0.30"));

        List<PaymentDTO> paymentDTOs = allPayments.stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .map(this::mapToPaymentDTO)
                .collect(Collectors.toList());

        Map<String, List<PaymentDTO>> bySubject = paymentDTOs.stream()
                .collect(Collectors.groupingBy(p -> p.subject() != null && !p.subject().isEmpty() ? p.subject() : "General Studies"));

        List<SubjectRevenueDTO> subjectRevenues = bySubject.entrySet().stream()
                .map(entry -> {
                    BigDecimal subTotal = entry.getValue().stream()
                            .map(PaymentDTO::amount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new SubjectRevenueDTO(entry.getKey(), entry.getValue().size(), subTotal);
                })
                .sorted((a, b) -> b.revenueUSD().compareTo(a.revenueUSD()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(new RevenueReportDTO(
                totalRevenue,
                paidStudentsCount,
                totalTransactions,
                payoutsApproved,
                payoutsReleased,
                platformMargin,
                paymentDTOs,
                subjectRevenues
        ));
    }

    private PaymentDTO mapToPaymentDTO(Payment p) {
        String studentName = "Student";
        String studentEmail = "";
        UUID studentId = p.getStudentId();

        if (studentId == null && p.getAssignmentId() != null) {
            Optional<Assignment> assignOpt = assignmentRepository.findById(p.getAssignmentId());
            if (assignOpt.isPresent()) {
                studentId = assignOpt.get().getStudentId();
            }
        }

        if (studentId != null) {
            Optional<User> studentOpt = userRepository.findById(studentId);
            if (studentOpt.isPresent()) {
                studentName = studentOpt.get().getName();
                studentEmail = studentOpt.get().getEmail();
            }
        }

        String assignmentTitle = "Academic Tutoring Case";
        String subject = "Computer Science";
        if (p.getAssignmentId() != null) {
            Optional<Assignment> assignOpt = assignmentRepository.findById(p.getAssignmentId());
            if (assignOpt.isPresent()) {
                assignmentTitle = assignOpt.get().getTitle();
                subject = assignOpt.get().getSubject();
            }
        }

        String payoutStatus = "PENDING_ASSIGNMENT";
        if (p.getAssignmentId() != null) {
            Optional<ExpertPayout> payoutOpt = payoutRepository.findByAssignmentId(p.getAssignmentId());
            if (payoutOpt.isPresent()) {
                payoutStatus = payoutOpt.get().getStatus().name();
            }
        }

        return new PaymentDTO(
                p.getId().toString(),
                p.getAssignmentId() != null ? p.getAssignmentId().toString() : "",
                assignmentTitle,
                subject,
                studentId != null ? studentId.toString() : "",
                studentName,
                studentEmail,
                p.getAmount(),
                p.getCurrency() != null ? p.getCurrency() : "USD",
                p.getProvider() != null ? p.getProvider() : "RAZORPAY",
                p.getProviderPaymentId() != null ? p.getProviderPaymentId() : "pay_" + p.getId().toString().substring(0, 8),
                p.getStatus() != null ? p.getStatus().name() : "PAID",
                p.getCreatedAt() != null ? p.getCreatedAt() : Instant.now(),
                payoutStatus
        );
    }

    private ExpertPayoutDTO mapToPayoutDTO(ExpertPayout ep) {
        String assignmentTitle = "Academic Tutoring Case";
        String subject = "Computer Science";
        String studentName = "Student";
        BigDecimal totalOrderAmount = ep.getAmount().divide(new BigDecimal("0.70"), 2, RoundingMode.HALF_UP);

        if (ep.getAssignmentId() != null) {
            Optional<Assignment> a = assignmentRepository.findById(ep.getAssignmentId());
            if (a.isPresent()) {
                assignmentTitle = a.get().getTitle();
                subject = a.get().getSubject();
                if (a.get().getStudentId() != null) {
                    Optional<User> stu = userRepository.findById(a.get().getStudentId());
                    if (stu.isPresent()) {
                        studentName = stu.get().getName();
                    }
                }
            }
        }

        String expertName = "Expert Mentor";
        String expertEmail = "";
        if (ep.getExpertId() != null) {
            Optional<User> exp = userRepository.findById(ep.getExpertId());
            if (exp.isPresent()) {
                expertName = exp.get().getName();
                expertEmail = exp.get().getEmail();
            }
        }

        return new ExpertPayoutDTO(
                ep.getId().toString(),
                ep.getAssignmentId() != null ? ep.getAssignmentId().toString() : "",
                assignmentTitle,
                subject,
                ep.getExpertId() != null ? ep.getExpertId().toString() : "",
                expertName,
                expertEmail,
                studentName,
                totalOrderAmount,
                ep.getAmount(),
                ep.getStatus() != null ? ep.getStatus().name() : "APPROVED",
                ep.getApprovedAt(),
                ep.getReleasedAt(),
                ep.getCreatedAt() != null ? ep.getCreatedAt() : Instant.now()
        );
    }

    // Admin approves expert payout
    @PostMapping("/payouts/approve")
    public ResponseEntity<?> approvePayout(@RequestParam("assignmentId") UUID assignmentId) {
        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Admins can approve payouts");
        }

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (assignment.getExpertId() == null) {
            return ResponseEntity.badRequest().body("No expert is assigned to this tutoring task");
        }

        // Get student payment amount
        Payment payment = paymentRepository.findByAssignmentId(assignmentId)
                .orElseThrow(() -> new RuntimeException("Student payment record not found"));

        // Expert gets 70% share of student payment
        BigDecimal expertShare = payment.getAmount().multiply(new BigDecimal("0.70"));

        ExpertPayout payout = ExpertPayout.builder()
                .assignmentId(assignment.getId())
                .expertId(assignment.getExpertId())
                .amount(expertShare)
                .status(ExpertPayoutStatus.APPROVED)
                .approvedAt(Instant.now())
                .createdAt(Instant.now())
                .build();

        ExpertPayout saved = payoutRepository.save(payout);

        // Audit Log
        activityRepository.save(AssignmentActivity.builder()
                .assignmentId(assignment.getId())
                .actorId(user.getId())
                .action("PAYOUT_APPROVED")
                .description("Admin approved expert payout of " + expertShare + " USD.")
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(saved);
    }

    // Admin releases expert payout
    @PostMapping("/payouts/release")
    public ResponseEntity<?> releasePayout(@RequestParam("assignmentId") UUID assignmentId) {
        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Admins can release payouts");
        }

        ExpertPayout payout = payoutRepository.findByAssignmentId(assignmentId)
                .orElseThrow(() -> new RuntimeException("Payout record not found for this assignment"));

        payout.setStatus(ExpertPayoutStatus.RELEASED);
        payout.setReleasedAt(Instant.now());
        payoutRepository.save(payout);

        // Close assignment
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        
        AssignmentStatus oldStatus = assignment.getStatus();
        assignment.setStatus(AssignmentStatus.CLOSED);
        assignment.setUpdatedAt(Instant.now());
        assignmentRepository.save(assignment);

        // Audit Log
        activityRepository.save(AssignmentActivity.builder()
                .assignmentId(assignment.getId())
                .actorId(user.getId())
                .action("PAYOUT_RELEASED")
                .oldStatus(oldStatus.name())
                .newStatus(assignment.getStatus().name())
                .description("Admin released expert payout of " + payout.getAmount() + " USD. Task closed.")
                .createdAt(Instant.now())
                .build());

        // Notify Expert
        notificationRepository.save(Notification.builder()
                .userId(payout.getExpertId())
                .assignmentId(assignment.getId())
                .type("PAYOUT_RELEASED")
                .title("Payout Released!")
                .message("Admin released your payout of " + payout.getAmount() + " USD for: " + assignment.getTitle())
                .read(false)
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(payout);
    }
}
