package com.avoverseas.backend.common;

import com.avoverseas.backend.assignment.Assignment;
import com.avoverseas.backend.assignment.AssignmentRepository;
import com.avoverseas.backend.assignment.AssignmentStatus;
import com.avoverseas.backend.meeting.*;
import com.avoverseas.backend.payment.Payment;
import com.avoverseas.backend.payment.PaymentRepository;
import com.avoverseas.backend.payment.PaymentStatus;
import com.avoverseas.backend.payout.ExpertPayout;
import com.avoverseas.backend.payout.ExpertPayoutRepository;
import com.avoverseas.backend.payout.ExpertPayoutStatus;
import com.avoverseas.backend.user.User;
import com.avoverseas.backend.user.UserRepository;
import com.avoverseas.backend.user.UserRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ExpertPayoutRepository payoutRepository;

    @Autowired
    private MeetingRepository meetingRepository;

    @Autowired
    private ExpertAvailabilityRepository availabilityRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            jdbcTemplate.execute("ALTER TABLE meetings ALTER COLUMN status VARCHAR(50)");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE meetings ALTER COLUMN type VARCHAR(50)");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE meetings ALTER COLUMN assignment_id DROP NOT NULL");
        } catch (Exception ignored) {}

        String defaultPassword = passwordEncoder.encode("password123");

        // 1. Ensure core users exist
        User alice = getOrCreateUser("Alice (Student)", "student@test.com", defaultPassword, UserRole.STUDENT);
        User priya = getOrCreateUser("Priya Sharma", "priya@test.com", defaultPassword, UserRole.STUDENT);
        User sweety = getOrCreateUser("Seety", "sweety@gmail.com", defaultPassword, UserRole.STUDENT);
        User harsha = getOrCreateUser("Harsha", "harsha@gmail.com", defaultPassword, UserRole.STUDENT);
        User harshitha = getOrCreateUser("Harshitha Avusula", "avusulaharshitha1701@gmail.com", defaultPassword, UserRole.STUDENT);
        User pavan = getOrCreateUser("Pavan", "student@test1.com", defaultPassword, UserRole.STUDENT);

        User expert = getOrCreateUser("Dr. Smith (Expert)", "expert@test.com", defaultPassword, UserRole.EXPERT);
        User admin = getOrCreateUser("Bob (Admin)", "admin@test.com", defaultPassword, UserRole.ADMIN);

        List<User> students = List.of(alice, priya, sweety, harsha, harshitha, pavan);

        // 2. Synchronize assignments so each student has their respective order
        List<Assignment> allAssignments = assignmentRepository.findAll();
        if (!allAssignments.isEmpty()) {
            for (int i = 0; i < allAssignments.size() && i < students.size(); i++) {
                Assignment a = allAssignments.get(i);
                User stu = students.get(i);
                a.setStudentId(stu.getId());
                if (a.getExpertId() == null) {
                    a.setExpertId(expert.getId());
                }
                assignmentRepository.save(a);

                // Update corresponding payment record with studentId
                Optional<Payment> pOpt = paymentRepository.findByAssignmentId(a.getId());
                if (pOpt.isPresent()) {
                    Payment p = pOpt.get();
                    p.setStudentId(stu.getId());
                    paymentRepository.save(p);
                }
            }
        }

        // 3. Ensure expert availability
        if (availabilityRepository.count() == 0) {
            availabilityRepository.save(ExpertAvailability.builder()
                    .expertId(expert.getId())
                    .dayOfWeek(1)
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(10, 30))
                    .timezone("Asia/Kolkata")
                    .active(true)
                    .build());
            availabilityRepository.save(ExpertAvailability.builder()
                    .expertId(expert.getId())
                    .dayOfWeek(1)
                    .startTime(LocalTime.of(11, 0))
                    .endTime(LocalTime.of(11, 30))
                    .timezone("Asia/Kolkata")
                    .active(true)
                    .build());
            availabilityRepository.save(ExpertAvailability.builder()
                    .expertId(expert.getId())
                    .dayOfWeek(2)
                    .startTime(LocalTime.of(15, 0))
                    .endTime(LocalTime.of(15, 30))
                    .timezone("Asia/Kolkata")
                    .active(true)
                    .build());
        }

        // 4. Seed Expert Payouts if empty
        if (payoutRepository.count() == 0 && !allAssignments.isEmpty()) {
            Assignment a1 = allAssignments.get(0);
            payoutRepository.save(ExpertPayout.builder()
                    .assignmentId(a1.getId())
                    .expertId(expert.getId())
                    .amount(new BigDecimal("105.00")) // 70% of $150
                    .status(ExpertPayoutStatus.APPROVED)
                    .approvedAt(Instant.now().minus(2, ChronoUnit.DAYS))
                    .createdAt(Instant.now().minus(3, ChronoUnit.DAYS))
                    .build());

            if (allAssignments.size() > 1) {
                Assignment a2 = allAssignments.get(1);
                payoutRepository.save(ExpertPayout.builder()
                        .assignmentId(a2.getId())
                        .expertId(expert.getId())
                        .amount(new BigDecimal("105.00"))
                        .status(ExpertPayoutStatus.RELEASED)
                        .approvedAt(Instant.now().minus(5, ChronoUnit.DAYS))
                        .releasedAt(Instant.now().minus(4, ChronoUnit.DAYS))
                        .createdAt(Instant.now().minus(6, ChronoUnit.DAYS))
                        .build());
            }
        }

        // 5. Seed comprehensive Meeting dataset if empty
        if (meetingRepository.count() == 0) {
            Instant now = Instant.now();

            // Meeting 1: Upcoming NEXT Meeting (Tomorrow 6:30 PM)
            UUID assign1Id = !allAssignments.isEmpty() ? allAssignments.get(0).getId() : null;
            meetingRepository.save(Meeting.builder()
                    .title("Requirement Discussion & Application Roadmap")
                    .assignmentId(assign1Id)
                    .studentId(priya.getId())
                    .expertId(expert.getId())
                    .type(MeetingType.REQUIREMENT_DISCUSSION)
                    .scheduledAt(now.plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS).plus(18, ChronoUnit.HOURS).plus(30, ChronoUnit.MINUTES))
                    .durationMinutes(45)
                    .platform("Zoom")
                    .meetingLink("https://zoom.us/j/98765432101")
                    .status(MeetingStatus.UPCOMING)
                    .purpose("Discuss academic requirements, university preferences, GRE scores, and international application roadmap.")
                    .expertNotes("")
                    .discussionSummary("")
                    .studentRequirements("Targeting US Fall 2027 for Computer Science MS programs.")
                    .recommendations("Prepare Statement of Purpose draft and 3 recommendation letters.")
                    .followUpActions("Upload unofficial transcripts and review SOP outline.")
                    .nextMeetingDate("28 Aug 2026")
                    .studentConfirmed(false)
                    .createdAt(now.minus(1, ChronoUnit.DAYS))
                    .updatedAt(now.minus(1, ChronoUnit.DAYS))
                    .build());

            // Meeting 2: Currently LIVE Meeting
            UUID assign2Id = allAssignments.size() > 1 ? allAssignments.get(1).getId() : null;
            meetingRepository.save(Meeting.builder()
                    .title("Full-Stack Cloud Architecture Mentoring")
                    .assignmentId(assign2Id)
                    .studentId(harshitha.getId())
                    .expertId(expert.getId())
                    .type(MeetingType.TUTORING_SESSION)
                    .scheduledAt(now.minus(10, ChronoUnit.MINUTES))
                    .durationMinutes(60)
                    .platform("Jitsi")
                    .meetingLink("https://meet.jit.si/av-overseas-live-tutoring-room")
                    .status(MeetingStatus.LIVE)
                    .purpose("Live 1-on-1 walkthrough on Spring Boot microservices and AWS containerized deployment.")
                    .expertNotes("Discussing Docker multi-stage builds and AWS ECS cluster setup.")
                    .discussionSummary("Going over container optimization and API security.")
                    .studentRequirements("Needs guidance on Dockerfile caching and environment variables.")
                    .recommendations("Use non-root user in Docker images and enable JWT refresh tokens.")
                    .followUpActions("Implement Redis token blacklist and test deploy to AWS staging.")
                    .nextMeetingDate("30 Aug 2026")
                    .studentConfirmed(false)
                    .createdAt(now.minus(2, ChronoUnit.DAYS))
                    .updatedAt(now)
                    .build());

            // Meeting 3: Academic Counseling (Upcoming in 3 days)
            UUID assign3Id = allAssignments.size() > 2 ? allAssignments.get(2).getId() : null;
            meetingRepository.save(Meeting.builder()
                    .title("University Selection & Profile Evaluation")
                    .assignmentId(assign3Id)
                    .studentId(sweety.getId())
                    .expertId(expert.getId())
                    .type(MeetingType.UNIVERSITY_SELECTION)
                    .scheduledAt(now.plus(3, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS).plus(15, ChronoUnit.HOURS))
                    .durationMinutes(30)
                    .platform("Google Meet")
                    .meetingLink("https://meet.google.com/abc-defg-hij")
                    .status(MeetingStatus.UPCOMING)
                    .purpose("Review shortlist of top 10 universities across Canada and Germany based on budget and GPA.")
                    .expertNotes("")
                    .discussionSummary("")
                    .studentRequirements("Prefers public research universities in Germany and Canada with English-taught programs.")
                    .recommendations("Review DAAD scholarship criteria and TU Munich entry requirements.")
                    .followUpActions("Shortlist 5 Dream, 3 Target, and 2 Safe universities.")
                    .nextMeetingDate("02 Sep 2026")
                    .studentConfirmed(false)
                    .createdAt(now.minus(3, ChronoUnit.DAYS))
                    .updatedAt(now.minus(3, ChronoUnit.DAYS))
                    .build());

            // Meeting 4: Mock Interview (Upcoming in 5 days)
            UUID assign4Id = allAssignments.size() > 3 ? allAssignments.get(3).getId() : null;
            meetingRepository.save(Meeting.builder()
                    .title("Visa & Admissions Mock Interview")
                    .assignmentId(assign4Id)
                    .studentId(harsha.getId())
                    .expertId(expert.getId())
                    .type(MeetingType.MOCK_INTERVIEW)
                    .scheduledAt(now.plus(5, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS).plus(11, ChronoUnit.HOURS))
                    .durationMinutes(45)
                    .platform("Zoom")
                    .meetingLink("https://zoom.us/j/12345678901")
                    .status(MeetingStatus.UPCOMING)
                    .purpose("Simulate F1 Visa officer interview questions, financial documentation review, and speech clarity.")
                    .expertNotes("")
                    .discussionSummary("")
                    .studentRequirements("Needs practice with answering questions regarding funding and career ties.")
                    .recommendations("Bring financial affidavits and DS-160 confirmation to the session.")
                    .followUpActions("Conduct round 2 mock interview if confidence score is below 85%.")
                    .nextMeetingDate("05 Sep 2026")
                    .studentConfirmed(false)
                    .createdAt(now.minus(4, ChronoUnit.DAYS))
                    .updatedAt(now.minus(4, ChronoUnit.DAYS))
                    .build());

            // Meeting 5: Completed Solution Walkthrough
            UUID assign5Id = allAssignments.size() > 4 ? allAssignments.get(4).getId() : null;
            meetingRepository.save(Meeting.builder()
                    .title("MERN Stack Codebase Explanation Session")
                    .assignmentId(assign5Id)
                    .studentId(pavan.getId())
                    .expertId(expert.getId())
                    .type(MeetingType.EXPLANATION)
                    .scheduledAt(now.minus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS).plus(14, ChronoUnit.HOURS))
                    .durationMinutes(60)
                    .platform("Jitsi")
                    .meetingLink("https://meet.jit.si/av-overseas-mern-explanation")
                    .status(MeetingStatus.COMPLETED)
                    .purpose("Complete walkthrough of React frontend state management and Express REST APIs.")
                    .expertNotes("Explained Redux Toolkit slice architecture, Axios interceptors, and JWT authentication.")
                    .discussionSummary("Walked through all 12 modules of the project. Student asked questions on middleware error handling.")
                    .studentRequirements("Requested additional code comments in the authentication controller.")
                    .recommendations("Practice building a simple CRUD app to reinforce Redux concepts.")
                    .followUpActions("Delivered final zip archive and documentation PDF to student workspace.")
                    .nextMeetingDate("Completed")
                    .studentConfirmed(true)
                    .createdAt(now.minus(7, ChronoUnit.DAYS))
                    .updatedAt(now.minus(2, ChronoUnit.DAYS))
                    .build());

            // Meeting 6: Completed Application Guidance
            meetingRepository.save(Meeting.builder()
                    .title("SOP & Letter of Recommendation Review")
                    .assignmentId(assign1Id)
                    .studentId(alice.getId())
                    .expertId(expert.getId())
                    .type(MeetingType.APPLICATION_GUIDANCE)
                    .scheduledAt(now.minus(5, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS).plus(16, ChronoUnit.HOURS))
                    .durationMinutes(45)
                    .platform("Zoom")
                    .meetingLink("https://zoom.us/j/5566778899")
                    .status(MeetingStatus.COMPLETED)
                    .purpose("Line-by-line review of Statement of Purpose and Resume formatting for Stanford and CMU.")
                    .expertNotes("Reviewed academic achievements and emphasized research papers published in IEEE.")
                    .discussionSummary("Polished opening paragraph to highlight machine learning research experience.")
                    .studentRequirements("Required formatting to comply with single-spaced 2-page PDF guideline.")
                    .recommendations("Highlight quantifiable impact in research section.")
                    .followUpActions("Student submitted updated draft on 22 Aug 2026.")
                    .nextMeetingDate("29 Aug 2026")
                    .studentConfirmed(true)
                    .createdAt(now.minus(10, ChronoUnit.DAYS))
                    .updatedAt(now.minus(5, ChronoUnit.DAYS))
                    .build());

            // Meeting 7: Cancelled Session
            meetingRepository.save(Meeting.builder()
                    .title("Introductory GRE Preparation Strategy")
                    .assignmentId(assign1Id)
                    .studentId(priya.getId())
                    .expertId(expert.getId())
                    .type(MeetingType.ACADEMIC_COUNSELING)
                    .scheduledAt(now.minus(6, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS).plus(10, ChronoUnit.HOURS))
                    .durationMinutes(30)
                    .platform("Google Meet")
                    .meetingLink("https://meet.google.com/xyz-uvwx-rst")
                    .status(MeetingStatus.CANCELLED)
                    .purpose("GRE verbal and quantitative score target assessment.")
                    .expertNotes("Cancelled due to student university midterm exams. Rescheduled to a later date.")
                    .discussionSummary("")
                    .studentRequirements("")
                    .recommendations("")
                    .followUpActions("Rescheduled to 25 Aug 2026.")
                    .nextMeetingDate("25 Aug 2026")
                    .studentConfirmed(false)
                    .createdAt(now.minus(8, ChronoUnit.DAYS))
                    .updatedAt(now.minus(6, ChronoUnit.DAYS))
                    .build());
        }

        System.out.println("--- DB SEEDING COMPLETED WITH STUDENTS, PAYOUTS & MEETINGS ---");
    }

    private User getOrCreateUser(String name, String email, String passwordHash, UserRole role) {
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            return existing.get();
        }
        User user = User.builder()
                .name(name)
                .email(email)
                .passwordHash(passwordHash)
                .role(role)
                .createdAt(Instant.now())
                .build();
        return userRepository.save(user);
    }
}
