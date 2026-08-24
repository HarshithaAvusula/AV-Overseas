import React, { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:8080/api/v1';

// Dynamic Sidebar Menu Configurations by Role
const menusByRole = {
  STUDENT: [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'assignments', label: 'My Assignments', icon: '📋' },
    { id: 'new_assignment', label: 'New Assignment', icon: '➕' },
    { id: 'meetings', label: 'Meetings', icon: '📅' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ],
  EXPERT: [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'assignments', label: 'Assignments', icon: '📋' },
    { id: 'meetings', label: 'Meetings', icon: '📅' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'files', label: 'Files', icon: '📁' },
    { id: 'earnings', label: 'Earnings', icon: '💰' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'availability', label: 'Availability', icon: '⚙️' }
  ],
  ADMIN: [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'assignments', label: 'Assignments', icon: '📋' },
    { id: 'students', label: 'Students', icon: '👥' },
    { id: 'experts', label: 'Experts', icon: '🧑💻' },
    { id: 'meetings', label: 'Meetings', icon: '📅' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'payouts', label: 'Expert Payouts', icon: '💰' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'files', label: 'Files', icon: '📁' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]
};

export default function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login/Reg form states
  const [email, setEmail] = useState('student@test.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [regRole, setRegRole] = useState('STUDENT');
  const [errorMsg, setErrorMsg] = useState('');

  // UI View States
  const [currentView, setCurrentView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Domain states
  const [assignments, setAssignments] = useState([]);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [expertsList, setExpertsList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [paymentsList, setPaymentsList] = useState([]);
  const [payoutsList, setPayoutsList] = useState([]);
  const [revenueReport, setRevenueReport] = useState(null);
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [payoutSearchQuery, setPayoutSearchQuery] = useState('');

  // Meetings management states
  const [meetingsList, setMeetingsList] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetingSearchQuery, setMeetingSearchQuery] = useState('');
  const [meetingTypeFilter, setMeetingTypeFilter] = useState('ALL');
  const [meetingStatusFilter, setMeetingStatusFilter] = useState('ALL');
  const [meetingTimeframe, setMeetingTimeframe] = useState('ALL');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetingNotesForm, setMeetingNotesForm] = useState({
    discussionSummary: '',
    studentRequirements: '',
    recommendations: '',
    followUpActions: '',
    nextMeetingDate: '',
    status: '',
    expertNotes: ''
  });
  const [newMeetingForm, setNewMeetingForm] = useState({
    title: '',
    studentId: '',
    expertId: '',
    assignmentId: '',
    type: 'REQUIREMENT_DISCUSSION',
    scheduledAt: '',
    durationMinutes: 45,
    platform: 'Zoom',
    purpose: ''
  });
  
  // Custom slots variables
  const [selectedExpertId, setSelectedExpertId] = useState('');
  const [selectedMeetingTime, setSelectedMeetingTime] = useState('');
  const [expertNotes, setExpertNotes] = useState('');

  // Payment Success Popup states
  const [paymentSuccessModal, setPaymentSuccessModal] = useState(null);
  const [paymentToast, setPaymentToast] = useState(null);

  // Enterprise Header & Omnibar states
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [notifFilter, setNotifFilter] = useState('ALL');

  // New assignment Form states
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Computer Science');
  const [newDesc, setNewDesc] = useState('');
  const [newInst, setNewInst] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newWordCount, setNewWordCount] = useState(1500);

  // S3 upload variables
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadFileType, setUploadFileType] = useState('ORIGINAL_ASSIGNMENT');

  const chatEndRef = useRef(null);
  const prevMessagesLength = useRef(0);

  // Decode JWT on start
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.userId,
          email: payload.sub,
          role: payload.role,
          name: payload.name || payload.sub?.split('@')[0] || (payload.role === 'STUDENT' ? 'Student' : payload.role === 'EXPERT' ? 'Expert' : 'Admin')
        });
      } catch (e) {
        logout();
      }
    }
  }, [token]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch initial datasets
  useEffect(() => {
    if (user) {
      fetchAssignments();
      fetchNotifications();
      fetchPayments();
      fetchMeetingsList();
      if (user.role === 'ADMIN') {
        fetchExperts();
        fetchStudents();
        fetchPayouts();
        fetchRevenueReport();
      } else if (user.role === 'EXPERT') {
        fetchPayouts();
      }
    } else {
      setAssignments([]);
      setActiveAssignment(null);
      setNotifications([]);
      setStudentsList([]);
      setExpertsList([]);
      setPaymentsList([]);
      setPayoutsList([]);
      setMeetingsList([]);
      setSelectedMeeting(null);
      setRevenueReport(null);
    }
  }, [user]);

  // Fetch assignment-specific context
  useEffect(() => {
    if (activeAssignment) {
      fetchChatHistory();
      fetchAssignmentFiles();
      fetchAuditTrail();
      fetchMeetings();
      if (activeAssignment.expertId) {
        fetchExpertAvailability(activeAssignment.expertId);
      }
    }
  }, [activeAssignment]);

  // Auto-scroll chat length check
  useEffect(() => {
    if (chatMessages.length > prevMessagesLength.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = chatMessages.length;
  }, [chatMessages]);

  // Auto-poll
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeAssignment) {
        fetchChatHistory();
        fetchAuditTrail();
        fetchMeetings();
      }
      if (user) {
        fetchNotifications();
        fetchAssignments();
        fetchPayments();
        fetchMeetingsList();
        if (user.role === 'ADMIN') {
          fetchStudents();
          fetchExperts();
          fetchPayouts();
          fetchRevenueReport();
        } else if (user.role === 'EXPERT') {
          fetchPayouts();
        }
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [activeAssignment, user]);

  const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('token');
    setActiveAssignment(null);
    setCurrentView('dashboard');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setUser({
          id: data.id,
          email: data.email,
          role: data.role,
          name: data.name
        });
      } else {
        const text = await res.text();
        setErrorMsg(text || 'Authentication Failed');
      }
    } catch (err) {
      setErrorMsg('Cannot connect to Spring Boot backend. Verify it is running.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: regRole })
      });
      if (res.ok) {
        setIsRegistering(false);
        setErrorMsg('Registration successful! Please sign in with your email and password.');
      } else {
        const text = await res.text();
        setErrorMsg(text || 'Registration Failed');
      }
    } catch (err) {
      setErrorMsg('Failed to register.');
    }
  };

  const simulateRole = async (targetRole) => {
    let testEmail = '';
    if (targetRole === 'STUDENT') testEmail = 'student@test.com';
    else if (targetRole === 'EXPERT') testEmail = 'expert@test.com';
    else if (targetRole === 'ADMIN') testEmail = 'admin@test.com';

    setEmail(testEmail);
    setPassword('password123');

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: 'password123' })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setUser({
          id: data.id,
          email: data.email,
          role: data.role,
          name: data.name
        });
        setActiveAssignment(null);
        setCurrentView('dashboard');
      }
    } catch (err) {
      alert(`Backend is offline. Start the backend first.`);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`${API_BASE}/assignments`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
        if (activeAssignment) {
          const updated = data.find(a => a.id === activeAssignment.id);
          if (updated) setActiveAssignment(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchExperts = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/experts`, { headers: headers() });
      if (res.ok) {
        setExpertsList(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/students`, { headers: headers() });
      if (res.ok) {
        setStudentsList(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${API_BASE}/payments`, { headers: headers() });
      if (res.ok) {
        setPaymentsList(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPayouts = async () => {
    try {
      const res = await fetch(`${API_BASE}/payouts`, { headers: headers() });
      if (res.ok) {
        setPayoutsList(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMeetingsList = async () => {
    try {
      const res = await fetch(`${API_BASE}/meetings`, { headers: headers() });
      if (res.ok) {
        setMeetingsList(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenMeetingDetails = (meeting) => {
    setSelectedMeeting(meeting);
    setMeetingNotesForm({
      discussionSummary: meeting.discussionSummary || '',
      studentRequirements: meeting.studentRequirements || '',
      recommendations: meeting.recommendations || '',
      followUpActions: meeting.followUpActions || '',
      nextMeetingDate: meeting.nextMeetingDate || '',
      status: meeting.status || 'UPCOMING',
      expertNotes: meeting.expertNotes || ''
    });
  };

  const handleUpdateMeetingNotes = async (meetingId) => {
    if (!meetingId) return;
    try {
      const res = await fetch(`${API_BASE}/meetings/${meetingId}/notes`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(meetingNotesForm)
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedMeeting(updated);
        fetchMeetingsList();
        alert('Meeting notes & recommendations saved successfully!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateMeetingStatus = async (meetingId, status) => {
    if (!meetingId) return;
    try {
      const res = await fetch(`${API_BASE}/meetings/${meetingId}/status`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedMeeting(updated);
        fetchMeetingsList();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleScheduleNewMeeting = async (e) => {
    if (e) e.preventDefault();
    if (!newMeetingForm.title || !newMeetingForm.studentId || !newMeetingForm.scheduledAt) {
      alert('Please provide meeting title, select student, and pick a scheduled date & time.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/meetings/schedule`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(newMeetingForm)
      });
      if (res.ok) {
        setShowScheduleModal(false);
        setNewMeetingForm({
          title: '',
          studentId: '',
          expertId: '',
          assignmentId: '',
          type: 'REQUIREMENT_DISCUSSION',
          scheduledAt: '',
          durationMinutes: 45,
          platform: 'Zoom',
          purpose: ''
        });
        fetchMeetingsList();
        alert('Mentorship session scheduled successfully!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRevenueReport = async () => {
    try {
      const res = await fetch(`${API_BASE}/reports/revenue`, { headers: headers() });
      if (res.ok) {
        setRevenueReport(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChatHistory = async () => {
    if (!activeAssignment) return;
    try {
      const res = await fetch(`${API_BASE}/chat/assignment/${activeAssignment.id}`, { headers: headers() });
      if (res.ok) {
        setChatMessages(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAssignmentFiles = async () => {
    if (!activeAssignment) return;
    try {
      const res = await fetch(`${API_BASE}/assignments/${activeAssignment.id}/files`, { headers: headers() });
      if (res.ok) {
        setUploadedFiles(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAuditTrail = async () => {
    if (!activeAssignment) return;
    try {
      const res = await fetch(`${API_BASE}/assignments/${activeAssignment.id}/audit`, { headers: headers() });
      if (res.ok) {
        setAuditTrail(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMeetings = async () => {
    if (!activeAssignment) return;
    try {
      const res = await fetch(`${API_BASE}/meetings/assignment/${activeAssignment.id}`, { headers: headers() });
      if (res.ok) {
        setMeetings(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchExpertAvailability = async (expertId) => {
    try {
      const res = await fetch(`${API_BASE}/meetings/expert/${expertId}/availability`, { headers: headers() });
      if (res.ok) {
        setAvailabilities(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`, { headers: headers() });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'POST', headers: headers() });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDeadline) return;

    try {
      const res = await fetch(`${API_BASE}/assignments`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          title: newTitle,
          subject: newSubject,
          description: newDesc,
          instructions: newInst,
          deadline: new Date(newDeadline).toISOString(),
          wordCount: parseInt(newWordCount)
        })
      });
      if (res.ok) {
        setNewTitle('');
        setNewDesc('');
        setNewInst('');
        setNewDeadline('');
        fetchAssignments();
        setCurrentView('assignments');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePayAssignment = async (assignmentId, amount) => {
    try {
      const orderRes = await fetch(`${API_BASE}/payments/create-order`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ assignmentId, amount })
      });
      
      if (!orderRes.ok) {
        const errMsg = await orderRes.text();
        alert("Failed to initiate Razorpay order: " + errMsg);
        return;
      }

      const orderData = await orderRes.json();

      const processPaymentVerification = async (payId, orderId, signature) => {
        try {
          const verifyRes = await fetch(`${API_BASE}/payments/verify`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({
              assignmentId: orderData.assignmentId,
              razorpayPaymentId: payId,
              razorpayOrderId: orderId,
              razorpaySignature: signature
            })
          });

          if (verifyRes.ok) {
            // Refresh platform state
            fetchAssignments();
            fetchNotifications();

            // Trigger Pop-up Modal saying "Payment Successful"
            setPaymentSuccessModal({
              amount: amount || 150.00,
              currency: 'USD',
              assignmentTitle: activeAssignment?.title || 'Academic Tutoring Project',
              txnId: payId
            });

            setPaymentToast({
              title: 'Payment Successful',
              message: 'Your payment was processed successfully. An expert tutor is being assigned.'
            });

            setTimeout(() => {
              setPaymentToast(null);
            }, 5000);
          } else {
            const text = await verifyRes.text();
            alert("Payment verification failed: " + text);
          }
        } catch (err) {
          console.error(err);
          alert("Verification connection error.");
        }
      };

      if (window.Razorpay) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "AV Overseas",
          description: "Academic Tutoring Deposit Fee",
          order_id: orderData.orderId,
          handler: function (response) {
            processPaymentVerification(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );
          },
          prefill: {
            name: user.name,
            email: user.email
          },
          theme: {
            color: "#4f46e5"
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          alert("Payment failed: " + (response.error?.description || 'Checkout canceled'));
        });
        rzp.open();
      } else {
        // Simulated Direct Checkout Fallback
        const mockPayId = "pay_sim_" + Date.now().toString().slice(-8);
        const mockSig = "sig_sim_" + Date.now();
        await processPaymentVerification(mockPayId, orderData.orderId, mockSig);
      }
      
    } catch (e) {
      console.error(e);
      alert("Error initiating Razorpay checkout.");
    }
  };

  const handleAssignExpert = async () => {
    if (!selectedExpertId) return;
    try {
      const res = await fetch(`${API_BASE}/assignments/${activeAssignment.id}/assign`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ expertId: selectedExpertId })
      });
      if (res.ok) {
        fetchAssignments();
        setSelectedExpertId('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBookMeeting = async (type) => {
    if (!selectedMeetingTime) return;
    try {
      const res = await fetch(`${API_BASE}/meetings/book`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          assignmentId: activeAssignment.id,
          type,
          scheduledAt: new Date(selectedMeetingTime).toISOString()
        })
      });
      if (res.ok) {
        setSelectedMeetingTime('');
        fetchAssignments();
        fetchMeetings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNotes = async (meetingId) => {
    if (!expertNotes) return;
    try {
      const res = await fetch(`${API_BASE}/meetings/${meetingId}/notes`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ notes: expertNotes })
      });
      if (res.ok) {
        setExpertNotes('');
        fetchAssignments();
        fetchMeetings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmNotes = async (meetingId) => {
    try {
      const res = await fetch(`${API_BASE}/meetings/${meetingId}/confirm`, {
        method: 'POST',
        headers: headers()
      });
      if (res.ok) {
        fetchAssignments();
        fetchMeetings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', uploadFileType);

    try {
      const res = await fetch(`${API_BASE}/assignments/${activeAssignment.id}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        fetchAssignmentFiles();
        fetchAuditTrail();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (status, desc) => {
    try {
      const res = await fetch(`${API_BASE}/assignments/${activeAssignment.id}/status`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ status, description: desc })
      });
      if (res.ok) {
        fetchAssignments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprovePayout = async (assignId) => {
    const targetId = assignId || activeAssignment?.id;
    if (!targetId) return;
    try {
      const res = await fetch(`${API_BASE}/payouts/approve?assignmentId=${targetId}`, {
        method: 'POST',
        headers: headers()
      });
      if (res.ok) {
        fetchPayments();
        fetchRevenueReport();
        fetchAssignments();
        if (activeAssignment) fetchAuditTrail();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReleasePayout = async (assignId) => {
    const targetId = assignId || activeAssignment?.id;
    if (!targetId) return;
    try {
      const res = await fetch(`${API_BASE}/payouts/release?assignmentId=${targetId}`, {
        method: 'POST',
        headers: headers()
      });
      if (res.ok) {
        fetchPayments();
        fetchRevenueReport();
        fetchAssignments();
        if (activeAssignment) fetchAuditTrail();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!typedMessage.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          assignmentId: activeAssignment.id,
          text: typedMessage
        })
      });
      if (res.ok) {
        setTypedMessage('');
        fetchChatHistory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusLabel = (status) => {
    return status?.replace(/_/g, ' ');
  };

  const localizeTime = (utcString) => {
    if (!utcString) return '';
    const date = new Date(utcString);
    return date.toLocaleString();
  };

  const handleMenuItemClick = (menuId) => {
    setCurrentView(menuId);
    setActiveAssignment(null);
    setMobileMenuOpen(false);
  };

  const handleOpenWorkspace = (assignment) => {
    setActiveAssignment(assignment);
    setCurrentView('project_details');
  };

  if (!token || !user) {
    return (
      <div className="main-container" style={{ maxWidth: '480px', marginTop: '10vh' }}>
        <div className="ambient-glow-1"></div>
        <div className="ambient-glow-2"></div>
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h1 className="logo" style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            AV OVERSEAS
          </h1>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Academic Tutoring & Support Platform
          </p>

          <form onSubmit={isRegistering ? handleRegister : handleLogin}>
            {isRegistering && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {isRegistering && (
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={regRole} onChange={e => setRegRole(e.target.value)}>
                  <option value="STUDENT">STUDENT</option>
                  <option value="EXPERT">EXPERT</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            )}

            {errorMsg && (
              <div style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
              {isRegistering ? 'Create Account' : 'Sign In'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? 'Back to Login' : 'Register New Account'}
            </button>
          </form>

          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textAlign: 'center' }}>
              ⚡ 1-Click Login by Role
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.5rem 0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}
                onClick={() => simulateRole('STUDENT')}
              >
                <span style={{ fontSize: '1.2rem' }}>🎓</span>
                <span style={{ fontWeight: '600' }}>Student</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.5rem 0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}
                onClick={() => simulateRole('EXPERT')}
              >
                <span style={{ fontSize: '1.2rem' }}>🔬</span>
                <span style={{ fontWeight: '600' }}>Expert</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.5rem 0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}
                onClick={() => simulateRole('ADMIN')}
              >
                <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                <span style={{ fontWeight: '600' }}>Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Metrics Calculation
  const getMetrics = () => {
    if (user.role === 'STUDENT') {
      const total = assignments.length;
      const inProgress = assignments.filter(a => ['IN_PROGRESS', 'REQUIREMENT_MEETING', 'REQUIREMENT_CONFIRMED', 'ASSIGNED'].includes(a.status)).length;
      const completed = assignments.filter(a => ['COMPLETED', 'EXPLANATION_MEETING', 'DELIVERED', 'CLOSED'].includes(a.status)).length;
      return { total, inProgress, completed, nextMeeting: 'Tomorrow 6:30 PM' };
    } else if (user.role === 'EXPERT') {
      const active = assignments.filter(a => !['CLOSED', 'COMPLETED'].includes(a.status)).length;
      const reqMtgs = assignments.filter(a => a.status === 'REQUIREMENT_MEETING').length;
      const pendingReview = assignments.filter(a => a.status === 'ADMIN_REVIEW').length;
      return { active, reqMtgs, pendingReview, earnings: '$1,240 USD' };
    } else {
      // Admin Metrics
      const total = assignments.length;
      const newRequests = assignments.filter(a => a.status === 'PENDING_PAYMENT').length;
      const unassigned = assignments.filter(a => a.status === 'PAID').length;
      const underReview = assignments.filter(a => a.status === 'ADMIN_REVIEW').length;
      const totalStudents = studentsList.length;
      return { total, newRequests, unassigned, underReview, totalStudents };
    }
  };

  const localizeDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  const localizeTimeOnly = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const getMeetingStatusBadge = (status) => {
    switch (status) {
      case 'LIVE':
        return <span className="badge" style={{ background: '#ef4444', color: '#fff', fontWeight: '700', padding: '0.3rem 0.65rem' }}>🟢 LIVE NOW</span>;
      case 'UPCOMING':
      case 'SCHEDULED':
        return <span className="badge badge-pending">⏳ UPCOMING</span>;
      case 'COMPLETED':
        return <span className="badge badge-success">✓ COMPLETED</span>;
      case 'CANCELLED':
        return <span className="badge badge-danger">✕ CANCELLED</span>;
      case 'NO_SHOW':
        return <span className="badge badge-danger" style={{ background: '#78716c', color: '#fff' }}>⚠️ NO SHOW</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  const getPlatformIcon = (platform) => {
    if (!platform) return '📹 Online Room';
    const p = platform.toLowerCase();
    if (p.includes('zoom')) return '🔵 Zoom';
    if (p.includes('google')) return '🔴 Google Meet';
    if (p.includes('jitsi')) return '🟣 Jitsi Meet';
    return '📹 ' + platform;
  };

  const metrics = getMetrics();
  const menuItems = menusByRole[user.role] || [];

  return (
    <div className="app-shell">
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">AV OVERSEAS</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '0.75rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {user.role} Panel
        </div>
        <div className="sidebar-divider"></div>
        <nav className="sidebar-menu">
          {menuItems.map(item => (
            <div
              key={item.id}
              className={`sidebar-item ${currentView === item.id && !activeAssignment ? 'active' : ''}`}
              onClick={() => handleMenuItemClick(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
          <div className="sidebar-divider"></div>
          <div className="sidebar-item" style={{ marginTop: 'auto' }} onClick={logout}>
            <span>🚪</span>
            <span>Logout</span>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Enterprise Top Navbar */}
        <header className="navbar">
          {/* Left: Breadcrumbs & System Status */}
          <div className="header-left">
            <button
              className="btn btn-secondary"
              style={{ display: 'none', padding: '0.4rem 0.6rem' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
            <div className="header-breadcrumbs">
              <span className="breadcrumb-root" onClick={() => { setActiveAssignment(null); setCurrentView('dashboard'); }}>
                <span>🏢</span>
                <span>AV Overseas</span>
              </span>
              <span className="breadcrumb-separator">/</span>
              <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                {activeAssignment ? (
                  <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setActiveAssignment(null)}>
                    {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
                  </span>
                ) : (
                  currentView.charAt(0).toUpperCase() + currentView.slice(1)
                )}
              </span>
              {activeAssignment && (
                <>
                  <span className="breadcrumb-separator">/</span>
                  <span className="breadcrumb-current" title={activeAssignment.title}>
                    {activeAssignment.title}
                  </span>
                </>
              )}
            </div>

            <div className="system-status-badge">
              <div className="status-pulse-dot"></div>
              <span>Live Gateway</span>
            </div>
          </div>

          {/* Center: Enterprise Omnibar Quick Search */}
          <div className="header-center">
            <div className="header-search-bar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="header-search-input"
                placeholder="Search cases, files, topics..."
                value={headerSearch}
                onChange={e => {
                  setHeaderSearch(e.target.value);
                  setShowSearchDropdown(e.target.value.trim().length > 0);
                }}
                onFocus={() => {
                  if (headerSearch.trim().length > 0) setShowSearchDropdown(true);
                }}
              />
              <span className="search-shortcut-kbd">⌘K</span>
            </div>

            {/* Omnibar Search Results Dropdown */}
            {showSearchDropdown && headerSearch.trim().length > 0 && (
              <div className="search-results-dropdown">
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.25rem 0.5rem', fontWeight: '600', textTransform: 'uppercase' }}>
                  Matching Projects ({assignments.filter(a => a.title.toLowerCase().includes(headerSearch.toLowerCase()) || a.subject.toLowerCase().includes(headerSearch.toLowerCase())).length})
                </div>
                {assignments
                  .filter(a => a.title.toLowerCase().includes(headerSearch.toLowerCase()) || a.subject.toLowerCase().includes(headerSearch.toLowerCase()))
                  .slice(0, 5)
                  .map(a => (
                    <div
                      key={a.id}
                      className="search-result-item"
                      onClick={() => {
                        setActiveAssignment(a);
                        setShowSearchDropdown(false);
                        setHeaderSearch('');
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>{a.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{a.subject} • {a.status}</div>
                      </div>
                      <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>View</span>
                    </div>
                  ))}
                {assignments.filter(a => a.title.toLowerCase().includes(headerSearch.toLowerCase()) || a.subject.toLowerCase().includes(headerSearch.toLowerCase())).length === 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem', textAlign: 'center' }}>
                    No matching assignments found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Environment Switcher, Notifications & Profile */}
          <div className="header-right">
            {/* Active Authenticated Role Badge */}
            <div
              className={`login-role-badge role-badge-${user.role.toLowerCase()}`}
              title={`Logged in as ${user.role}`}
            >
              <span>{user.role === 'STUDENT' ? '🎓' : user.role === 'EXPERT' ? '🔬' : '🛡️'}</span>
              <span>{user.role === 'STUDENT' ? 'Student Workspace' : user.role === 'EXPERT' ? 'Expert Tutor' : 'Admin Console'}</span>
            </div>

            {/* Notification Center Trigger */}
            <div style={{ position: 'relative' }}>
              <div
                className="enterprise-icon-btn"
                title="Platform Notifications"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="notif-badge-dot">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>

              {/* Enterprise Notification Center Dropdown */}
              {showNotifications && (
                <div className="notification-popover-card">
                  <div className="notif-header">
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        Notification Center
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {notifications.filter(n => !n.read).length} unread updates
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        className="role-btn"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => {
                          notifications.filter(n => !n.read).forEach(n => markNotificationRead(n.id));
                        }}
                      >
                        Mark all read
                      </button>
                      <button
                        className="role-btn"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => setShowNotifications(false)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', background: '#ffffff', padding: '0 1rem' }}>
                    <button
                      style={{
                        border: 'none',
                        background: 'none',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: notifFilter === 'ALL' ? '600' : '400',
                        color: notifFilter === 'ALL' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        borderBottom: notifFilter === 'ALL' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => setNotifFilter('ALL')}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      style={{
                        border: 'none',
                        background: 'none',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: notifFilter === 'UNREAD' ? '600' : '400',
                        color: notifFilter === 'UNREAD' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        borderBottom: notifFilter === 'UNREAD' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => setNotifFilter('UNREAD')}
                    >
                      Unread ({notifications.filter(n => !n.read).length})
                    </button>
                  </div>

                  {/* Notification Items List */}
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {notifications
                      .filter(n => notifFilter === 'ALL' || !n.read)
                      .length === 0 ? (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        <span>📭</span>
                        <div style={{ marginTop: '0.5rem' }}>No notifications to display</div>
                      </div>
                    ) : (
                      notifications
                        .filter(n => notifFilter === 'ALL' || !n.read)
                        .map(n => (
                          <div
                            key={n.id}
                            className={`notif-item ${!n.read ? 'unread' : ''}`}
                            onClick={() => markNotificationRead(n.id)}
                          >
                            <div style={{ fontSize: '1.2rem', marginTop: '0.1rem' }}>
                              {n.type?.includes('PAYMENT') || n.type?.includes('OTP') ? '💳' : n.type?.includes('MEETING') ? '📅' : n.type?.includes('ASSIGN') ? '📋' : '🔔'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: n.read ? '500' : '700', color: 'var(--text-primary)' }}>
                                  {n.title}
                                </span>
                                {!n.read && (
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }}></span>
                                )}
                              </div>
                              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: '1.35' }}>
                                {n.message}
                              </p>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                                {localizeTime(n.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Enterprise User Profile Pill Trigger */}
            <div style={{ position: 'relative' }}>
              <div
                className="profile-pill-btn"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
              >
                <div className="user-avatar-circle">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AV'}
                </div>
                <div className="user-profile-summary">
                  <span className="user-profile-name">{user.name}</span>
                  <span className={`user-profile-role-tag role-tag-${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              {/* Enterprise User Profile Dropdown */}
              {showProfileMenu && (
                <div className="profile-dropdown-card">
                  <div className="profile-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="user-avatar-circle" style={{ width: '38px', height: '38px', fontSize: '0.9rem' }}>
                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AV'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Organization</span>
                      <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>AV-GLOBAL-US</span>
                    </div>
                  </div>

                  <div className="profile-card-body">
                    <div className="profile-menu-item" onClick={() => { setActiveAssignment(null); setCurrentView('dashboard'); setShowProfileMenu(false); }}>
                      <span>📊</span>
                      <span>Dashboard Overview</span>
                    </div>
                    <div className="profile-menu-item" onClick={() => { setActiveAssignment(null); setCurrentView('meetings'); setShowProfileMenu(false); }}>
                      <span>📅</span>
                      <span>Schedule & Sessions</span>
                    </div>
                    <div className="profile-menu-item" onClick={() => { setActiveAssignment(null); setCurrentView('chat'); setShowProfileMenu(false); }}>
                      <span>💬</span>
                      <span>Direct Workspace Messages</span>
                    </div>
                    <div style={{ height: '1px', background: 'var(--border-glass)', margin: '0.3rem 0' }}></div>
                    <div className="profile-menu-item" onClick={logout}>
                      <span>🔄</span>
                      <span>Switch Role / Account</span>
                    </div>
                    <div className="profile-menu-item danger" onClick={logout}>
                      <span>🚪</span>
                      <span>Sign Out</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Sub-view Content Pane */}
        <div className="content-pane">
          
          {/* VIEW: ROLE SPECIFIC DASHBOARDS */}
          {currentView === 'dashboard' && !activeAssignment && (
            <div>
              {/* STUDENT DASHBOARD METRICS */}
              {user.role === 'STUDENT' && (
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>Student Dashboard</h2>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <span className="metric-label">Total Assignments</span>
                      <span className="metric-value">{metrics.total}</span>
                      <span className="metric-desc">Submitted tutoring cases</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">In Progress</span>
                      <span className="metric-value">{metrics.inProgress}</span>
                      <span className="metric-desc">Tutors reviewing instructions</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Completed</span>
                      <span className="metric-value">{metrics.completed}</span>
                      <span className="metric-desc">Archived solved tutoring cases</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Upcoming Meeting</span>
                      <span className="metric-value" style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>{metrics.nextMeeting}</span>
                      <span className="metric-desc">Requirement walkthrough</span>
                    </div>
                  </div>
                </div>
              )}

              {/* EXPERT DASHBOARD METRICS */}
              {user.role === 'EXPERT' && (
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>Expert Dashboard</h2>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <span className="metric-label">Active Tasks</span>
                      <span className="metric-value">{metrics.active}</span>
                      <span className="metric-desc">Mentoring and support jobs</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Requirement Meetings</span>
                      <span className="metric-value">{metrics.reqMtgs}</span>
                      <span className="metric-desc">Meetings scheduled this week</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Pending Review</span>
                      <span className="metric-value">{metrics.pendingReview}</span>
                      <span className="metric-desc">Drafts uploaded for admin quality checks</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">This Month Earnings</span>
                      <span className="metric-value" style={{ fontSize: '1.4rem' }}>{metrics.earnings}</span>
                      <span className="metric-desc">Tutoring share payouts</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN DASHBOARD METRICS */}
              {user.role === 'ADMIN' && (
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>Admin Dashboard</h2>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <span className="metric-label">Total Assignments</span>
                      <span className="metric-value">{metrics.total}</span>
                      <span className="metric-desc">Registered student orders</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">New Requests</span>
                      <span className="metric-value">{metrics.newRequests}</span>
                      <span className="metric-desc">Pending payment confirmation</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Unassigned Cases</span>
                      <span className="metric-value">{metrics.unassigned}</span>
                      <span className="metric-desc">Paid orders awaiting expert assign</span>
                    </div>
                    <div className="metric-card" style={{ borderLeft: '4px solid #10b981' }}>
                      <span className="metric-label">Registered Students</span>
                      <span className="metric-value" style={{ color: '#059669' }}>{metrics.totalStudents || studentsList.length}</span>
                      <span className="metric-desc">Student profiles registered till date</span>
                    </div>
                  </div>
                </div>
              )}

              {/* RECENT ASSIGNMENTS SECTION */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
                  {user.role === 'STUDENT' ? 'Recent Assignments' : user.role === 'EXPERT' ? 'My Assigned Tutoring Cases' : 'All Requests Queue'}
                </h3>
                {assignments.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', padding: '2rem 0', textAlign: 'center' }}>No assignments listed yet.</p>
                ) : (
                  <div className="table-container">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Topic</th>
                          <th>Status</th>
                          <th>Deadline (Local)</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.slice(0, 5).map(a => (
                          <tr key={a.id}>
                            <td><span className="badge badge-info">{a.subject}</span></td>
                            <td style={{ fontWeight: '500' }}>{a.title}</td>
                            <td>
                              <span className={`badge ${
                                a.status === 'PENDING_PAYMENT' ? 'badge-danger' : 
                                a.status === 'CLOSED' ? 'badge-success' : 'badge-pending'
                              }`}>
                                {getStatusLabel(a.status)}
                              </span>
                            </td>
                            <td>{localizeTime(a.deadline)}</td>
                            <td>
                              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleOpenWorkspace(a)}>
                                Open Workspace
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: ALL ASSIGNMENTS LIST */}
          {currentView === 'assignments' && !activeAssignment && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Tutoring Projects Workspace</h3>
              {assignments.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', padding: '2rem 0', textAlign: 'center' }}>No assignments found.</p>
              ) : (
                <div className="table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Topic</th>
                        <th>Status</th>
                        <th>Deadline</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map(a => (
                        <tr key={a.id}>
                          <td><span className="badge badge-info">{a.subject}</span></td>
                          <td style={{ fontWeight: '500' }}>{a.title}</td>
                          <td>
                            <span className={`badge ${
                              a.status === 'PENDING_PAYMENT' ? 'badge-danger' : 
                              a.status === 'CLOSED' ? 'badge-success' : 'badge-pending'
                            }`}>
                              {getStatusLabel(a.status)}
                            </span>
                          </td>
                          <td>{localizeTime(a.deadline)}</td>
                          <td>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleOpenWorkspace(a)}>
                              Open Workspace
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW: NEW ASSIGNMENT (STUDENTS ONLY) */}
          {currentView === 'new_assignment' && !activeAssignment && user.role === 'STUDENT' && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>
                Submit New Academic Support Case
              </h2>
              <form onSubmit={handleCreateAssignment}>
                <div className="form-group">
                  <label className="form-label">Support Topic / Title</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Spring Boot REST Integration Review"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Subject Domain</label>
                    <select className="form-select" value={newSubject} onChange={e => setNewSubject(e.target.value)}>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Academic Writing">Academic Writing</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Word Count Target</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newWordCount}
                      onChange={e => setNewWordCount(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Instructions / Tutoring Details</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Detail the exact concepts or instructions you need help with..."
                      value={newInst}
                      onChange={e => setNewInst(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">General Description</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Brief overview..."
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Requested Deadline (Your Local Timezone)</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    required
                    value={newDeadline}
                    onChange={e => setNewDeadline(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Submit Request Details
                </button>
              </form>
            </div>
          )}

          {/* VIEW: EXPERTS LIST (ADMIN ONLY) */}
          {currentView === 'experts' && !activeAssignment && user.role === 'ADMIN' && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Academic Experts Registry</h3>
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Expert Name</th>
                      <th>Email</th>
                      <th>System ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expertsList.map(exp => (
                      <tr key={exp.id}>
                        <td style={{ fontWeight: '600' }}>{exp.name}</td>
                        <td>{exp.email}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{exp.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: STUDENT DIRECTORY (ADMIN ONLY) */}
          {currentView === 'students' && !activeAssignment && user.role === 'ADMIN' && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Students Registry</h3>
                    <span className="badge badge-success" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}>
                      🎓 {studentsList.length} Registered Till Date
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    Comprehensive registry of all student profiles registered on the platform till date, with registration timestamps and orders.
                  </p>
                </div>

                {/* Search Filter Box */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="🔍 Search student name or email..."
                    value={studentSearchQuery}
                    onChange={e => setStudentSearchQuery(e.target.value)}
                    style={{ width: '260px', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                  />
                  {studentSearchQuery && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => setStudentSearchQuery('')}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="metric-card" style={{ padding: '1rem 1.25rem', background: '#ffffff', borderLeft: '4px solid var(--accent-primary)' }}>
                  <span className="metric-label" style={{ fontSize: '0.72rem' }}>Total Students</span>
                  <span className="metric-value" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}>{studentsList.length}</span>
                  <span className="metric-desc">Registered till date</span>
                </div>
                <div className="metric-card" style={{ padding: '1rem 1.25rem', background: '#ffffff', borderLeft: '4px solid #10b981' }}>
                  <span className="metric-label" style={{ fontSize: '0.72rem' }}>Total Orders Placed</span>
                  <span className="metric-value" style={{ fontSize: '1.5rem', color: '#059669' }}>
                    {studentsList.reduce((sum, s) => sum + (s.totalOrders || 0), 0)}
                  </span>
                  <span className="metric-desc">Across all student accounts</span>
                </div>
                <div className="metric-card" style={{ padding: '1rem 1.25rem', background: '#ffffff', borderLeft: '4px solid #f59e0b' }}>
                  <span className="metric-label" style={{ fontSize: '0.72rem' }}>Active Workspaces</span>
                  <span className="metric-value" style={{ fontSize: '1.5rem', color: '#d97706' }}>
                    {studentsList.reduce((sum, s) => sum + (s.activeOrders || 0), 0)}
                  </span>
                  <span className="metric-desc">Orders currently in progress</span>
                </div>
              </div>

              {/* Students Registry Table */}
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Student Profile</th>
                      <th>Email Address</th>
                      <th>Registered Till Date</th>
                      <th>Total Orders</th>
                      <th>Active Projects</th>
                      <th>Account Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList
                      .filter(s => 
                        s.name?.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                        s.email?.toLowerCase().includes(studentSearchQuery.toLowerCase())
                      )
                      .map(s => (
                        <tr key={s.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div className="user-avatar-circle" style={{ width: '32px', height: '32px', fontSize: '0.78rem' }}>
                                {s.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                                  {s.name}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                  ID: {s.id.slice(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                            {s.email}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {localizeTime(s.createdAt)}
                          </td>
                          <td>
                            <span className="badge badge-info" style={{ fontWeight: '600' }}>
                              {s.totalOrders || 0} orders
                            </span>
                          </td>
                          <td>
                            {s.activeOrders > 0 ? (
                              <span className="badge badge-pending">
                                {s.activeOrders} active
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>None</span>
                            )}
                          </td>
                          <td>
                            <span className="badge badge-success">
                              ACTIVE STUDENT
                            </span>
                          </td>
                        </tr>
                      ))}
                    {studentsList.filter(s => 
                      s.name?.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                      s.email?.toLowerCase().includes(studentSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                          No registered students found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: STUDENT PAYMENTS DIRECTORY (INDEPENDENT) */}
          {currentView === 'payments' && !activeAssignment && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                      Student Payments Directory
                    </h3>
                    <span className="badge badge-success" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}>
                      💳 {new Set(paymentsList.map(p => p.studentId || p.studentEmail)).size} Students Paid Till Date
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    Live log of all verified student orders and checkout transactions received via the Razorpay payment gateway.
                  </p>
                </div>

                {/* Search Filter Box */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="🔍 Search payments by student, subject, Txn ID..."
                    value={paymentSearchQuery}
                    onChange={e => setPaymentSearchQuery(e.target.value)}
                    style={{ width: '300px', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                  />
                  {paymentSearchQuery && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => setPaymentSearchQuery('')}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Financial KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="metric-card" style={{ padding: '1.15rem', background: '#ffffff', borderLeft: '4px solid #10b981' }}>
                  <span className="metric-label" style={{ fontSize: '0.74rem' }}>Students Paid Till Date</span>
                  <span className="metric-value" style={{ fontSize: '1.65rem', color: '#059669', fontWeight: '800' }}>
                    {new Set(paymentsList.map(p => p.studentId || p.studentEmail)).size} Students
                  </span>
                  <span className="metric-desc">Distinct paying student accounts</span>
                </div>
                <div className="metric-card" style={{ padding: '1.15rem', background: '#ffffff', borderLeft: '4px solid var(--accent-primary)' }}>
                  <span className="metric-label" style={{ fontSize: '0.74rem' }}>Total Revenue Captured</span>
                  <span className="metric-value" style={{ fontSize: '1.65rem', color: 'var(--accent-primary)', fontWeight: '800' }}>
                    ${paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toFixed(2)} USD
                  </span>
                  <span className="metric-desc">Gross funds from student checkouts</span>
                </div>
                <div className="metric-card" style={{ padding: '1.15rem', background: '#ffffff', borderLeft: '4px solid #6366f1' }}>
                  <span className="metric-label" style={{ fontSize: '0.74rem' }}>Successful Transactions</span>
                  <span className="metric-value" style={{ fontSize: '1.65rem', color: '#4f46e5', fontWeight: '800' }}>
                    {paymentsList.length} Paid
                  </span>
                  <span className="metric-desc">Verified transactions in ledger</span>
                </div>
                <div className="metric-card" style={{ padding: '1.15rem', background: '#ffffff', borderLeft: '4px solid #f59e0b' }}>
                  <span className="metric-label" style={{ fontSize: '0.74rem' }}>Average Order Value</span>
                  <span className="metric-value" style={{ fontSize: '1.65rem', color: '#d97706', fontWeight: '800' }}>
                    ${paymentsList.length > 0 ? (paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) / paymentsList.length).toFixed(2) : '0.00'} USD
                  </span>
                  <span className="metric-desc">Per academic mentoring booking</span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Paid By (Student)</th>
                      <th>Assignment Topic</th>
                      <th>Subject</th>
                      <th>Amount Paid</th>
                      <th>Date (Local)</th>
                      <th>Gateway Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsList
                      .filter(p => 
                        p.studentName?.toLowerCase().includes(paymentSearchQuery.toLowerCase()) || 
                        p.studentEmail?.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
                        p.assignmentTitle?.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
                        p.subject?.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
                        p.providerPaymentId?.toLowerCase().includes(paymentSearchQuery.toLowerCase())
                      )
                      .map(p => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {p.providerPaymentId || 'pay_' + p.id.slice(0, 8)}
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              via {p.provider || 'Razorpay'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div className="user-avatar-circle" style={{ width: '28px', height: '28px', fontSize: '0.72rem' }}>
                                {p.studentName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '0.84rem' }}>{p.studentName}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.studentEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: '600', fontSize: '0.84rem', color: 'var(--text-primary)' }}>{p.assignmentTitle}</div>
                          </td>
                          <td>
                            <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>{p.subject || 'Academic'}</span>
                          </td>
                          <td>
                            <span style={{ fontWeight: '700', color: 'var(--accent-success)', fontSize: '0.92rem' }}>
                              ${Number(p.amount).toFixed(2)} {p.currency || 'USD'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {localizeTime(p.createdAt)}
                          </td>
                          <td>
                            <span className="badge badge-success">
                              ✓ {p.status || 'PAID'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    {paymentsList.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                          No verified student payments recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: EXPERT PAYOUTS & COMPENSATION LEDGER (INDEPENDENT) */}
          {(currentView === 'payouts' || currentView === 'earnings') && !activeAssignment && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                      {user.role === 'ADMIN' ? 'Expert Payouts & Compensation Ledger' : 'My Expert Earnings & Payouts'}
                    </h3>
                    <span className="badge badge-info" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}>
                      💰 70% Tutor Share Allocation
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    {user.role === 'ADMIN'
                      ? 'Review expert tutor milestone deliverables, approve remuneration (70% share), and disburse final payouts.'
                      : 'Detailed ledger of your approved and released compensation for completed student mentoring assignments.'}
                  </p>
                </div>

                {/* Search Filter Box */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="🔍 Search payouts by expert, topic, ID..."
                    value={payoutSearchQuery}
                    onChange={e => setPayoutSearchQuery(e.target.value)}
                    style={{ width: '280px', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                  />
                  {payoutSearchQuery && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => setPayoutSearchQuery('')}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Payout Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="metric-card" style={{ padding: '1.15rem', background: '#ffffff', borderLeft: '4px solid #6366f1' }}>
                  <span className="metric-label" style={{ fontSize: '0.74rem' }}>Total Expert Share Pool (70%)</span>
                  <span className="metric-value" style={{ fontSize: '1.65rem', color: '#4f46e5', fontWeight: '800' }}>
                    ${(paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) * 0.70).toFixed(2)} USD
                  </span>
                  <span className="metric-desc">Available for eligible completions</span>
                </div>
                <div className="metric-card" style={{ padding: '1.15rem', background: '#ffffff', borderLeft: '4px solid #10b981' }}>
                  <span className="metric-label" style={{ fontSize: '0.74rem' }}>Disbursed / Released Payouts</span>
                  <span className="metric-value" style={{ fontSize: '1.65rem', color: '#059669', fontWeight: '800' }}>
                    ${payoutsList.filter(p => p.status === 'RELEASED').reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toFixed(2)} USD
                  </span>
                  <span className="metric-desc">Successfully transferred to mentors</span>
                </div>
                <div className="metric-card" style={{ padding: '1.15rem', background: '#ffffff', borderLeft: '4px solid #f59e0b' }}>
                  <span className="metric-label" style={{ fontSize: '0.74rem' }}>Approved Payouts in Escrow</span>
                  <span className="metric-value" style={{ fontSize: '1.65rem', color: '#d97706', fontWeight: '800' }}>
                    ${payoutsList.filter(p => p.status === 'APPROVED').reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toFixed(2)} USD
                  </span>
                  <span className="metric-desc">Approved and awaiting release</span>
                </div>
                <div className="metric-card" style={{ padding: '1.15rem', background: '#ffffff', borderLeft: '4px solid var(--accent-primary)' }}>
                  <span className="metric-label" style={{ fontSize: '0.74rem' }}>Total Payout Records</span>
                  <span className="metric-value" style={{ fontSize: '1.65rem', color: 'var(--accent-primary)', fontWeight: '800' }}>
                    {payoutsList.length} Records
                  </span>
                  <span className="metric-desc">Tracked in compensation system</span>
                </div>
              </div>

              {/* Payouts Table */}
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Payout Ref</th>
                      <th>Expert Mentor</th>
                      <th>Student & Assignment</th>
                      <th>Student Deposit</th>
                      <th>Expert Compensation (70%)</th>
                      <th>Payout Status</th>
                      <th>Date</th>
                      {user.role === 'ADMIN' && <th>Admin Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {payoutsList
                      .filter(p => 
                        p.expertName?.toLowerCase().includes(payoutSearchQuery.toLowerCase()) || 
                        p.expertEmail?.toLowerCase().includes(payoutSearchQuery.toLowerCase()) ||
                        p.assignmentTitle?.toLowerCase().includes(payoutSearchQuery.toLowerCase()) ||
                        p.id?.toLowerCase().includes(payoutSearchQuery.toLowerCase())
                      )
                      .map(p => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                              PO_{p.id.slice(0, 8).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Bank / Gateway Transfer</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div className="user-avatar-circle" style={{ width: '28px', height: '28px', fontSize: '0.72rem', background: '#6366f1' }}>
                                {p.expertName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EX'}
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '0.84rem' }}>{p.expertName}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.expertEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: '600', fontSize: '0.84rem' }}>{p.assignmentTitle}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Student: {p.studentName || 'Student'}</div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                              ${Number(p.totalOrderAmount || 150).toFixed(2)} USD
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: '700', color: '#4f46e5', fontSize: '0.94rem' }}>
                              ${Number(p.amount).toFixed(2)} USD
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${
                              p.status === 'RELEASED' ? 'badge-success' :
                              p.status === 'APPROVED' ? 'badge-info' : 'badge-pending'
                            }`}>
                              {p.status === 'RELEASED' ? '✓ Released' :
                               p.status === 'APPROVED' ? '⏳ Approved' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {localizeTime(p.releasedAt || p.approvedAt || p.createdAt)}
                          </td>
                          {user.role === 'ADMIN' && (
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                {p.status === 'APPROVED' && p.assignmentId && (
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
                                    onClick={() => handleReleasePayout(p.assignmentId)}
                                    title="Release Funds & Disburse to Mentor"
                                  >
                                    Release Funds
                                  </button>
                                )}
                                {p.status === 'RELEASED' && (
                                  <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>✓ Disbursed</span>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    {payoutsList.length === 0 && (
                      <tr>
                        <td colSpan={user.role === 'ADMIN' ? 8 : 7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                          No expert payout records created yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: COMPREHENSIVE MEETINGS MANAGEMENT MODULE */}
          {currentView === 'meetings' && !activeAssignment && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* SECTION 1: HERO CARD - NEXT SCHEDULED / LIVE MEETING */}
              {(() => {
                const liveMeeting = meetingsList.find(m => m.status === 'LIVE');
                const upcomingMeeting = meetingsList.find(m => m.status === 'UPCOMING' || m.status === 'SCHEDULED');
                const heroMeeting = liveMeeting || upcomingMeeting || meetingsList[0];

                if (!heroMeeting) return null;

                const isLive = heroMeeting.status === 'LIVE';

                return (
                  <div className="glass-panel" style={{
                    padding: '2rem',
                    background: isLive 
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.04) 0%, rgba(255, 255, 255, 0.98) 100%)' 
                      : 'linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(255, 255, 255, 0.98) 100%)',
                    border: isLive ? '1.5px solid rgba(239, 68, 68, 0.35)' : '1.5px solid rgba(99, 102, 241, 0.25)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.25rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: isLive ? '#ef4444' : 'var(--accent-primary)' }}>
                            {isLive ? '🔴 Active Mentoring Session' : '📅 Next Scheduled Session'}
                          </span>
                          <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                            {heroMeeting.typeLabel || heroMeeting.type}
                          </span>
                          {getMeetingStatusBadge(heroMeeting.status)}
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                          {heroMeeting.title}
                        </h2>
                        {heroMeeting.purpose && (
                          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.4rem', maxWidth: '750px', lineHeight: '1.5' }}>
                            {heroMeeting.purpose}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {heroMeeting.meetingLink && (
                          <a
                            href={heroMeeting.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{
                              background: isLive ? '#ef4444' : 'var(--accent-primary)',
                              borderColor: isLive ? '#dc2626' : 'var(--accent-primary)',
                              fontSize: '0.88rem',
                              padding: '0.6rem 1.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontWeight: '700',
                              boxShadow: isLive ? '0 4px 14px rgba(239, 68, 68, 0.35)' : '0 4px 14px rgba(99, 102, 241, 0.25)'
                            }}
                          >
                            <span>🚀</span> Join Meeting
                          </a>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.85rem', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                          onClick={() => handleOpenMeetingDetails(heroMeeting)}
                        >
                          <span>📝</span> View Details & Notes
                        </button>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '1rem',
                      paddingTop: '1.25rem',
                      borderTop: '1px solid var(--border-glass)',
                      background: 'rgba(255, 255, 255, 0.6)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Student Attendee</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.25rem' }}>
                          <div className="user-avatar-circle" style={{ width: '24px', height: '24px', fontSize: '0.65rem' }}>
                            {heroMeeting.studentName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                          </div>
                          <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{heroMeeting.studentName}</span>
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Expert Mentor</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.25rem' }}>
                          <div className="user-avatar-circle" style={{ width: '24px', height: '24px', fontSize: '0.65rem', background: '#6366f1' }}>
                            {heroMeeting.expertName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EX'}
                          </div>
                          <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{heroMeeting.expertName}</span>
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Scheduled Time</span>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                          📅 {localizeDate(heroMeeting.scheduledAt)} • {localizeTimeOnly(heroMeeting.scheduledAt)}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Duration & Platform</span>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                          ⏱️ {heroMeeting.durationMinutes || 45} mins • {getPlatformIcon(heroMeeting.platform)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SECTION 2: SEARCH, FILTERS & OMNIBAR */}
              <div className="glass-panel" style={{ padding: '1.25rem 1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  {/* Left Filters */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="🔍 Search student, expert, purpose..."
                      value={meetingSearchQuery}
                      onChange={e => setMeetingSearchQuery(e.target.value)}
                      style={{ width: '260px', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                    />

                    {/* Meeting Type Filter */}
                    <select
                      className="form-input"
                      value={meetingTypeFilter}
                      onChange={e => setMeetingTypeFilter(e.target.value)}
                      style={{ width: '190px', padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                    >
                      <option value="ALL">All Meeting Types</option>
                      <option value="REQUIREMENT_DISCUSSION">Requirement Discussion</option>
                      <option value="ACADEMIC_COUNSELING">Academic Counseling</option>
                      <option value="TUTORING_SESSION">Tutoring Session</option>
                      <option value="MOCK_INTERVIEW">Mock Interview</option>
                      <option value="UNIVERSITY_SELECTION">University Selection</option>
                      <option value="APPLICATION_GUIDANCE">Application Guidance</option>
                      <option value="EXPLANATION">Solution Walkthrough</option>
                      <option value="FOLLOW_UP_MEETING">Follow-up Meeting</option>
                    </select>

                    {/* Meeting Status Filter */}
                    <select
                      className="form-input"
                      value={meetingStatusFilter}
                      onChange={e => setMeetingStatusFilter(e.target.value)}
                      style={{ width: '150px', padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="LIVE">Live Now</option>
                      <option value="UPCOMING">Upcoming</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="NO_SHOW">No Show</option>
                    </select>

                    {/* Timeframe Tabs */}
                    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 'var(--radius-sm)', padding: '0.2rem' }}>
                      {['ALL', 'UPCOMING', 'HISTORY'].map(tab => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setMeetingTimeframe(tab)}
                          style={{
                            border: 'none',
                            background: meetingTimeframe === tab ? '#ffffff' : 'transparent',
                            color: meetingTimeframe === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontWeight: meetingTimeframe === tab ? '700' : '500',
                            fontSize: '0.75rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            boxShadow: meetingTimeframe === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {tab === 'ALL' ? 'All Sessions' : tab === 'UPCOMING' ? 'Upcoming & Live' : 'Meeting History'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Actions */}
                  {(user.role === 'ADMIN' || user.role === 'EXPERT') && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: '0.82rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      onClick={() => setShowScheduleModal(true)}
                    >
                      <span>➕</span> Schedule Meeting
                    </button>
                  )}
                </div>
              </div>

              {/* SECTION 3: UPCOMING & LIVE SESSIONS CARDS */}
              {meetingTimeframe !== 'HISTORY' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                      Upcoming & Live Mentorship Sessions
                    </h3>
                    <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                      {meetingsList.filter(m => ['LIVE', 'UPCOMING', 'SCHEDULED'].includes(m.status)).length} Scheduled
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {meetingsList
                      .filter(m => ['LIVE', 'UPCOMING', 'SCHEDULED'].includes(m.status))
                      .filter(m => meetingStatusFilter === 'ALL' || m.status === meetingStatusFilter)
                      .filter(m => meetingTypeFilter === 'ALL' || m.type === meetingTypeFilter)
                      .filter(m => 
                        m.title?.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
                        m.studentName?.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
                        m.expertName?.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
                        m.purpose?.toLowerCase().includes(meetingSearchQuery.toLowerCase())
                      )
                      .map(m => (
                        <div key={m.id} className="assignment-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                              <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                                {m.typeLabel || m.type}
                              </span>
                              {getMeetingStatusBadge(m.status)}
                            </div>

                            <h4 style={{ fontSize: '0.98rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                              {m.title}
                            </h4>

                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: '1.4' }}>
                              {m.purpose ? (m.purpose.length > 100 ? m.purpose.slice(0, 100) + '...' : m.purpose) : '1-on-1 mentorship session.'}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem', background: '#f8fafc', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>🎓 Student:</span>
                                <strong style={{ color: 'var(--text-primary)' }}>{m.studentName}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>🔬 Expert:</span>
                                <strong style={{ color: 'var(--text-primary)' }}>{m.expertName}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>📅 Date & Time:</span>
                                <span>{localizeDate(m.scheduledAt)} • {localizeTimeOnly(m.scheduledAt)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>⏱️ Duration:</span>
                                <span>{m.durationMinutes || 45} mins ({getPlatformIcon(m.platform)})</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                            {m.meetingLink && (
                              <a
                                href={m.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                                style={{ flex: 1, textAlign: 'center', fontSize: '0.78rem', padding: '0.45rem 0.65rem' }}
                              >
                                Join Meeting
                              </a>
                            )}
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem 0.65rem' }}
                              onClick={() => handleOpenMeetingDetails(m)}
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    {meetingsList.filter(m => ['LIVE', 'UPCOMING', 'SCHEDULED'].includes(m.status)).length === 0 && (
                      <div style={{ gridColumn: '1 / -1', padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', background: '#ffffff', borderRadius: 'var(--radius-md)' }}>
                        No upcoming meetings found matching your filter criteria.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 4: MEETING HISTORY TABLE */}
              {meetingTimeframe !== 'UPCOMING' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                        Mentorship Meeting History
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Archive of completed, cancelled, and concluded mentoring sessions with notes and action plans.
                      </p>
                    </div>
                    <span className="badge badge-pending" style={{ fontSize: '0.75rem' }}>
                      {meetingsList.filter(m => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(m.status)).length} Archived
                    </span>
                  </div>

                  <div className="table-container">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Scheduled Date</th>
                          <th>Session Title</th>
                          <th>Meeting Type</th>
                          <th>Student</th>
                          <th>Expert Tutor</th>
                          <th>Duration</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meetingsList
                          .filter(m => meetingTimeframe === 'ALL' ? true : ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(m.status))
                          .filter(m => meetingStatusFilter === 'ALL' || m.status === meetingStatusFilter)
                          .filter(m => meetingTypeFilter === 'ALL' || m.type === meetingTypeFilter)
                          .filter(m => 
                            m.title?.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
                            m.studentName?.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
                            m.expertName?.toLowerCase().includes(meetingSearchQuery.toLowerCase())
                          )
                          .map(m => (
                            <tr key={m.id}>
                              <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                <strong>{localizeDate(m.scheduledAt)}</strong><br />
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{localizeTimeOnly(m.scheduledAt)}</span>
                              </td>
                              <td>
                                <div style={{ fontWeight: '600', fontSize: '0.84rem' }}>{m.title}</div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{getPlatformIcon(m.platform)}</span>
                              </td>
                              <td>
                                <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                                  {m.typeLabel || m.type}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                  <div className="user-avatar-circle" style={{ width: '24px', height: '24px', fontSize: '0.65rem' }}>
                                    {m.studentName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                                  </div>
                                  <span style={{ fontSize: '0.82rem', fontWeight: '500' }}>{m.studentName}</span>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                  <div className="user-avatar-circle" style={{ width: '24px', height: '24px', fontSize: '0.65rem', background: '#6366f1' }}>
                                    {m.expertName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EX'}
                                  </div>
                                  <span style={{ fontSize: '0.82rem', fontWeight: '500' }}>{m.expertName}</span>
                                </div>
                              </td>
                              <td style={{ fontSize: '0.82rem' }}>
                                {m.durationMinutes || 45} mins
                              </td>
                              <td>
                                {getMeetingStatusBadge(m.status)}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
                                  onClick={() => handleOpenMeetingDetails(m)}
                                >
                                  View Details & Notes
                                </button>
                              </td>
                            </tr>
                          ))}
                        {meetingsList.length === 0 && (
                          <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                              No meeting history records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: PROFILE PANEL */}
          {currentView === 'profile' && !activeAssignment && (
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }}>User Profile Details</h3>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" disabled value={user.name} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="text" className="form-input" disabled value={user.email} />
              </div>
              <div className="form-group">
                <label className="form-label">Platform Role</label>
                <span className="badge badge-info">{user.role}</span>
              </div>
            </div>
          )}

          {/* VIEW: SETTINGS & AVAILABILITY */}
          {(currentView === 'settings' || currentView === 'availability') && !activeAssignment && (
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                {user.role === 'EXPERT' ? 'Configure Availability Calendar' : 'Platform Preferences'}
              </h3>
              {user.role === 'EXPERT' ? (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Configure days and times you are available for student clarification calls.
                  </p>
                  <div className="form-group">
                    <label className="form-label">Timezone</label>
                    <select className="form-select">
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Weekly Hours</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="badge badge-pending">Mon, Tue, Wed</span>
                      <span>10:00 AM to 4:00 PM</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="form-group">
                    <label className="form-label">Timezone Display</label>
                    <select className="form-select">
                      <option>Detect Automatically (UTC+5:30)</option>
                      <option>GMT / UTC</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Alerts</label>
                    <input type="checkbox" defaultChecked /> Enable instant status transition email alerts.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: ADMIN REPORTS - PLATFORM REVENUE & ACTIVITY */}
          {currentView === 'reports' && !activeAssignment && user.role === 'ADMIN' && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Platform Revenue & Activity Reports</h3>
                    <span className="badge badge-success" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}>
                      📊 Executive Financial Summary
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    Real-time consolidated revenue generation, paid student count, expert payout allocations, and domain performance.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                  onClick={() => { fetchRevenueReport(); fetchPayments(); }}
                >
                  🔄 Refresh Financial Data
                </button>
              </div>

              {/* 4 Primary Financial KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="metric-card" style={{ padding: '1.25rem', background: '#ffffff', borderLeft: '4px solid #10b981' }}>
                  <span className="metric-label" style={{ fontSize: '0.74rem' }}>Total Revenue Generated</span>
                  <span className="metric-value" style={{ fontSize: '1.75rem', color: '#059669', fontWeight: '800' }}>
                    ${Number(revenueReport?.totalRevenueUSD || paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)).toFixed(2)} USD
                  </span>
                  <span className="metric-desc">Gross student deposit collections</span>
                </div>

                <div className="metric-card" style={{ padding: '1.25rem', background: '#ffffff', borderLeft: '4px solid var(--accent-primary)' }}>
                  <span className="metric-label" style={{ fontSize: '0.74rem' }}>Students Paid Till Date</span>
                  <span className="metric-value" style={{ fontSize: '1.75rem', color: 'var(--accent-primary)', fontWeight: '800' }}>
                    {revenueReport?.totalPaidStudentsCount || new Set(paymentsList.map(p => p.studentId || p.studentEmail)).size} Students
                  </span>
                  <span className="metric-desc">Across {paymentsList.length} verified transactions</span>
                </div>

                <div className="metric-card" style={{ padding: '1.25rem', background: '#ffffff', borderLeft: '4px solid #6366f1' }}>
                  <span className="metric-label" style={{ fontSize: '0.74rem' }}>Expert Payouts Share (70%)</span>
                  <span className="metric-value" style={{ fontSize: '1.75rem', color: '#4f46e5', fontWeight: '800' }}>
                    ${((Number(revenueReport?.totalRevenueUSD || paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0))) * 0.70).toFixed(2)} USD
                  </span>
                  <span className="metric-desc">Tutor compensation pool</span>
                </div>

                <div className="metric-card" style={{ padding: '1.25rem', background: '#ffffff', borderLeft: '4px solid #f59e0b' }}>
                  <span className="metric-label" style={{ fontSize: '0.74rem' }}>Net Platform Retained Margin (30%)</span>
                  <span className="metric-value" style={{ fontSize: '1.75rem', color: '#d97706', fontWeight: '800' }}>
                    ${((Number(revenueReport?.totalRevenueUSD || paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0))) * 0.30).toFixed(2)} USD
                  </span>
                  <span className="metric-desc">Net operating margin retained</span>
                </div>
              </div>

              {/* Breakdown by Academic Subject */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                    📚 Revenue by Academic Domain / Subject
                  </h4>
                  {revenueReport?.revenueBySubject?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {revenueReport.revenueBySubject.map((item, idx) => {
                        const totalRev = Number(revenueReport.totalRevenueUSD) || 1;
                        const pct = Math.min(100, Math.round((Number(item.revenueUSD) / totalRev) * 100));
                        return (
                          <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                              <span style={{ fontWeight: '600' }}>{item.subject}</span>
                              <span style={{ color: 'var(--accent-success)', fontWeight: '700' }}>
                                ${Number(item.revenueUSD).toFixed(2)} USD ({item.orderCount} orders)
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: idx % 2 === 0 ? 'var(--accent-primary)' : '#10b981', borderRadius: '4px' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                      No subject-specific transaction data available yet.
                    </div>
                  )}
                </div>

                {/* Platform Activity Overview */}
                <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                    ⚡ Platform Academic Operations & Health
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Total Assignments Created:</span>
                      <strong style={{ fontSize: '0.9rem' }}>{assignments.length} Cases</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Completed & Delivered Cases:</span>
                      <strong style={{ fontSize: '0.9rem', color: '#059669' }}>
                        {assignments.filter(a => ['COMPLETED', 'EXPLANATION_MEETING', 'DELIVERED', 'CLOSED'].includes(a.status)).length} Cases
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Active Workspaces in Progress:</span>
                      <strong style={{ fontSize: '0.9rem', color: '#d97706' }}>
                        {assignments.filter(a => ['IN_PROGRESS', 'REQUIREMENT_MEETING', 'REQUIREMENT_CONFIRMED', 'ASSIGNED', 'ADMIN_REVIEW'].includes(a.status)).length} Cases
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Average Price per Order:</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--accent-primary)' }}>$150.00 USD</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: MESSAGES (CHAT ROUTER) */}
          {currentView === 'messages' && !activeAssignment && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }}>Your Conversations</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Select a project below to enter its workspace and chat with your collaborator.
              </p>
              {assignments.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', padding: '2rem 0', textAlign: 'center' }}>No active conversations found.</p>
              ) : (
                <div className="table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Project Topic</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map(a => (
                        <tr key={a.id}>
                          <td><span className="badge badge-info">{a.subject}</span></td>
                          <td style={{ fontWeight: '500' }}>{a.title}</td>
                          <td><span className="badge badge-pending">{getStatusLabel(a.status)}</span></td>
                          <td>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleOpenWorkspace(a)}>
                              💬 Open Chat
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW: FILES DIRECTORY */}
          {currentView === 'files' && !activeAssignment && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }}>Global Document Directory</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Access and download all documents uploaded across your academic tutoring assignments.
              </p>
              {assignments.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', padding: '2rem 0', textAlign: 'center' }}>No files found.</p>
              ) : (
                <div className="table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Project Title</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map(a => (
                        <tr key={a.id}>
                          <td><span className="badge badge-info">{a.subject}</span></td>
                          <td style={{ fontWeight: '500' }}>{a.title}</td>
                          <td><span className="badge badge-pending">{getStatusLabel(a.status)}</span></td>
                          <td>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleOpenWorkspace(a)}>
                              📁 View S3 Files
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* DETAILED WORKSPACE FOR SINGLE ACTIVE PROJECT (Assignment details page as a central hub) */}
          {currentView === 'project_details' && activeAssignment && (
            <div>
              {/* Header Details */}
              <button
                className="btn btn-secondary"
                style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                onClick={() => handleMenuItemClick('assignments')}
              >
                ← Back to Projects List
              </button>

              <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>{activeAssignment.subject}</span>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{activeAssignment.title}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      {activeAssignment.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
                    <span className="badge badge-pending" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                      {getStatusLabel(activeAssignment.status)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Target Deadline:</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{localizeTime(activeAssignment.deadline)}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Word Count:</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{activeAssignment.wordCount} words</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Assigned Mentoring Expert:</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500', color: activeAssignment.expertId ? 'var(--text-primary)' : 'var(--accent-danger)' }}>
                      {activeAssignment.expertId ? 'Assigned' : 'Awaiting Assignment'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid-workspace">
                {/* Main area of project: Files, status transitions, call tools, chat */}
                <div>
                  
                  {/* WORKFLOW CONTROLLERS */}
                  <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-primary)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                      Project Workspace Actions ({user.role} View)
                    </h3>

                    {/* PENDING PAYMENT */}
                    {activeAssignment.status === 'PENDING_PAYMENT' && user.role === 'STUDENT' && (
                      <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                          Please complete the service fee deposit to initiate tutor search.
                        </p>
                        <button className="btn btn-success" onClick={() => handlePayAssignment(activeAssignment.id, 150.00)}>
                          Pay $150 USD (Razorpay Checkout)
                        </button>
                      </div>
                    )}

                    {/* ADMIN ASSIGNING EXPERT */}
                    {user.role === 'ADMIN' && !activeAssignment.expertId && (
                      <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                          Select an Academic Expert to schedule the Requirement meeting.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <select
                            className="form-select"
                            style={{ maxWidth: '300px' }}
                            value={selectedExpertId}
                            onChange={e => setSelectedExpertId(e.target.value)}
                          >
                            <option value="">Select Expert...</option>
                            {expertsList.map(exp => (
                              <option key={exp.id} value={exp.id}>{exp.name} ({exp.email})</option>
                            ))}
                          </select>
                          <button className="btn btn-primary" onClick={handleAssignExpert}>
                            Assign Selected Expert
                          </button>
                        </div>
                      </div>
                    )}

                    {/* REQUIREMENT MEETING SLOT BOOKING */}
                    {activeAssignment.status === 'ASSIGNED' && (
                      <div>
                        {user.role === 'STUDENT' ? (
                          <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                              An expert has been assigned. Please book your 15-30 min Requirement Discussion meeting.
                            </p>
                            {availabilities.length > 0 && (
                              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-primary)', display: 'block', marginBottom: '0.25rem' }}>
                                  Tutor's Standard Weekly Availability:
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  {availabilities.map((slot, idx) => (
                                    <span key={slot.id || idx} className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                                      {slot.dayOfWeek === 1 ? 'Mon' : slot.dayOfWeek === 2 ? 'Tue' : slot.dayOfWeek === 3 ? 'Wed' : slot.dayOfWeek === 4 ? 'Thu' : slot.dayOfWeek === 5 ? 'Fri' : slot.dayOfWeek === 6 ? 'Sat' : 'Sun'}: {slot.startTime} - {slot.endTime} ({slot.timezone})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                              <input
                                type="datetime-local"
                                className="form-input"
                                style={{ maxWidth: '250px' }}
                                value={selectedMeetingTime}
                                onChange={e => setSelectedMeetingTime(e.target.value)}
                              />
                              <button className="btn btn-primary" onClick={() => handleBookMeeting('REQUIREMENT')}>
                                Book Requirement Discussion
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Awaiting student to schedule the Requirement meeting slots.
                          </p>
                        )}
                      </div>
                    )}

                    {/* DURING REQUIREMENT MEETING */}
                    {activeAssignment.status === 'REQUIREMENT_MEETING' && (
                      <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                          Enter the platform classroom below to clarify instruction requirements.
                        </p>
                        {meetings.filter(m => m.type === 'REQUIREMENT').map(meet => (
                          <div key={meet.id} className="call-workspace">
                            <div className="video-feed">
                              <div className="video-avatar">{user.role === 'STUDENT' ? 'ES' : 'ST'}</div>
                              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                {user.role === 'STUDENT' ? 'Assigned Expert Tutor' : user.name}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Link: <a href={meet.meetingLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-info)' }}>{meet.meetingLink}</a>
                              </span>
                              <div className="call-controls">
                                <button className="btn-call-round">🎤</button>
                                <button className="btn-call-round">📹</button>
                                <button className="btn-call-round hangup">🛑</button>
                              </div>
                            </div>
                            <div className="call-sidebar">
                              <div className="call-sidebar-title">Meeting Workspace</div>
                              <div className="call-sidebar-content">
                                {user.role === 'EXPERT' ? (
                                  <div>
                                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Clarification Notes</label>
                                    <textarea
                                      className="form-textarea"
                                      placeholder="Note APA guidelines, bibliography targets, deliverable formats..."
                                      value={expertNotes}
                                      onChange={e => setExpertNotes(e.target.value)}
                                    />
                                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.8rem' }} onClick={() => handleSaveNotes(meet.id)}>
                                      Submit Requirements Notes
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: '600' }}>Confirmed Requirements Notes</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                      {meet.expertNotes || 'Awaiting expert to draft meeting notes...'}
                                    </p>
                                    {meet.status === 'COMPLETED' && !meet.studentConfirmed && (
                                      <button className="btn btn-success" style={{ width: '100%', marginTop: '1rem', fontSize: '0.8rem' }} onClick={() => handleConfirmNotes(meet.id)}>
                                        Confirm Requirements (Start Work)
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* EXPERT WORK STAGE (IN PROGRESS) */}
                    {activeAssignment.status === 'IN_PROGRESS' && (
                      <div>
                        {user.role === 'EXPERT' ? (
                          <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                              Requirements confirmed. Draft tutoring materials and upload draft files for Admin review.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                              <select className="form-select" style={{ maxWidth: '200px' }} value={uploadFileType} onChange={e => setUploadFileType(e.target.value)}>
                                <option value="EXPERT_DRAFT">EXPERT_DRAFT</option>
                              </select>
                              <input type="file" id="expert-draft-upload" style={{ display: 'none' }} onChange={handleUploadFile} />
                              <label htmlFor="expert-draft-upload" className="btn btn-primary">
                                Choose File & Upload
                              </label>
                              <button className="btn btn-secondary" onClick={() => handleUpdateStatus('ADMIN_REVIEW', 'Expert submitted draft for admin QA check.')}>
                                Submit to Admin Review
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Expert is actively preparing details and drafting documents.
                          </p>
                        )}
                      </div>
                    )}

                    {/* ADMIN REVIEW STAGE */}
                    {activeAssignment.status === 'ADMIN_REVIEW' && (
                      <div>
                        {user.role === 'ADMIN' ? (
                          <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                              QA Check. Review expert draft files. Approve or return for revisions.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                              <button className="btn btn-success" onClick={() => handleUpdateStatus('COMPLETED', 'Admin approved draft.')}>
                                Approve & Complete
                              </button>
                              <button className="btn btn-danger" onClick={() => handleUpdateStatus('REVISION_REQUIRED', 'Admin requested revisions.')}>
                                Return for Revision
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Admin is reviewing the draft tutoring solution files.
                          </p>
                        )}
                      </div>
                    )}

                    {/* REVISION REQUIRED */}
                    {activeAssignment.status === 'REVISION_REQUIRED' && (
                      <div>
                        {user.role === 'EXPERT' ? (
                          <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                              Admin requested revision changes. Upload updated draft solutions.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                              <select className="form-select" style={{ maxWidth: '200px' }} value={uploadFileType} onChange={e => setUploadFileType(e.target.value)}>
                                <option value="EXPERT_DRAFT">EXPERT_DRAFT</option>
                              </select>
                              <input type="file" id="revision-upload" style={{ display: 'none' }} onChange={handleUploadFile} />
                              <label htmlFor="revision-upload" className="btn btn-primary">
                                Upload Revised File
                              </label>
                              <button className="btn btn-secondary" onClick={() => handleUpdateStatus('ADMIN_REVIEW', 'Expert submitted revised draft.')}>
                                Submit to Admin Review
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Expert is updating solution files.
                          </p>
                        )}
                      </div>
                    )}

                    {/* COMPLETED STATUS - BOOK EXPLANATION Walkthrough */}
                    {activeAssignment.status === 'COMPLETED' && (
                      <div>
                        {user.role === 'STUDENT' ? (
                          <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                              Draft tutoring materials approved! Book your explanation session.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                              <input
                                type="datetime-local"
                                className="form-input"
                                style={{ maxWidth: '250px' }}
                                value={selectedMeetingTime}
                                onChange={e => setSelectedMeetingTime(e.target.value)}
                              />
                              <button className="btn btn-primary" onClick={() => handleBookMeeting('EXPLANATION')}>
                                Book Explanation Walkthrough
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Waiting for student to schedule the solution walkthrough meeting.
                          </p>
                        )}
                      </div>
                    )}

                    {/* EXPLANATION MEETING */}
                    {activeAssignment.status === 'EXPLANATION_MEETING' && (
                      <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                          Walkthrough explanation meeting in progress. Join room below.
                        </p>
                        {meetings.filter(m => m.type === 'EXPLANATION').map(meet => (
                          <div key={meet.id} className="call-workspace">
                            <div className="video-feed">
                              <div className="video-avatar">{user.role === 'STUDENT' ? 'ES' : 'ST'}</div>
                              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                {user.role === 'STUDENT' ? 'Assigned Expert Tutor' : user.name}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Link: <a href={meet.meetingLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-info)' }}>{meet.meetingLink}</a>
                              </span>
                              <div className="call-controls">
                                <button className="btn-call-round">🎤</button>
                                <button className="btn-call-round">📹</button>
                                <button className="btn-call-round hangup">🛑</button>
                              </div>
                            </div>
                            <div className="call-sidebar">
                              <div className="call-sidebar-title">Walkthrough Details</div>
                              <div className="call-sidebar-content">
                                {user.role === 'STUDENT' ? (
                                  <div>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: '600' }}>Confirm Learning</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1rem' }}>
                                      Confirm that the expert walked you through the concepts and code implementation.
                                    </p>
                                    <button className="btn btn-success" style={{ width: '100%', fontSize: '0.8rem' }} onClick={() => handleConfirmNotes(meet.id)}>
                                      Accept Tutoring Delivery
                                    </button>
                                  </div>
                                ) : (
                                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    Walk the student through the Spring Boot implementations and explain the concepts.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* DELIVERED / CLOSE WORKFLOW */}
                    {activeAssignment.status === 'DELIVERED' && (
                      <div>
                        {user.role === 'ADMIN' ? (
                          <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                              Delivery confirmed. Process payout calculation (70% share) and release it.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                              <button className="btn btn-primary" onClick={handleApprovePayout}>
                                1. Calculate & Approve Payout Share
                              </button>
                              <button className="btn btn-success" onClick={handleReleasePayout}>
                                2. Release Payout & Close Task
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Awaiting Admin confirmation and Expert payout release.
                          </p>
                        )}
                      </div>
                    )}

                    {/* CLOSED */}
                    {activeAssignment.status === 'CLOSED' && (
                      <p style={{ color: 'var(--accent-success)', fontWeight: '600', fontSize: '0.95rem' }}>
                        ✓ Case completed successfully. Expert paid out and order closed.
                      </p>
                    )}
                  </div>

                  {/* DOCUMENT MANAGER CARD */}
                  <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
                      Document Storage (S3 Mock Uploads)
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label className="form-label">Purpose</label>
                        <select className="form-select" style={{ width: '220px' }} value={uploadFileType} onChange={e => setUploadFileType(e.target.value)}>
                          <option value="ORIGINAL_ASSIGNMENT">ORIGINAL_ASSIGNMENT</option>
                          <option value="STUDENT_REFERENCE">STUDENT_REFERENCE</option>
                          {user.role === 'EXPERT' && <option value="EXPERT_DRAFT">EXPERT_DRAFT</option>}
                          {user.role === 'EXPERT' && <option value="EXPLANATION_DOCUMENT">EXPLANATION_DOCUMENT</option>}
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <input type="file" id="general-file-upload" style={{ display: 'none' }} onChange={handleUploadFile} />
                        <label htmlFor="general-file-upload" className="btn btn-secondary">
                          Choose File & Upload
                        </label>
                      </div>
                    </div>

                    {uploadedFiles.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No documents uploaded.</p>
                    ) : (
                      <div className="files-grid">
                        {uploadedFiles.map(file => (
                          <div key={file.id} className="file-card">
                            <div className="file-icon">📄</div>
                            <div className="file-info">
                              <div className="file-name" title={file.originalFileName}>{file.originalFileName}</div>
                              <div className="file-meta">
                                <span>Purpose: {file.fileType}</span><br />
                                <span>Size: {(file.fileSize / 1024).toFixed(1)} KB</span>
                              </div>
                              <a
                                href={`${API_BASE}/files/download?key=${file.storageKey}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', marginTop: '0.5rem', display: 'inline-block' }}
                              >
                                Download
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SECURED CHAT INTERFACE WITH PRIVACY AUDIT */}
                  <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.01)' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Platform Chat Workspace</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--accent-danger)' }}>
                        🔒 Privacy Guard Active. Direct contact details sharing is disabled.
                      </p>
                    </div>

                    <div className="chat-container">
                      <div className="chat-messages">
                        {chatMessages.length === 0 ? (
                          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 'auto' }}>
                            Send a message to start collaborating!
                          </p>
                        ) : (
                          chatMessages.map(msg => {
                            const isSentByMe = msg.senderId === user.id;
                            return (
                              <div
                                key={msg.id}
                                className={`chat-bubble ${isSentByMe ? 'sent' : 'received'} ${msg.containsContactInfo ? 'redacted' : ''}`}
                              >
                                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', display: 'block', color: 'rgba(255, 255, 255, 0.7)' }}>
                                  {isSentByMe ? 'You' : 'Collaborator'}
                                </span>
                                <div>{msg.messageText}</div>
                                {msg.containsContactInfo && (
                                  <div className="redacted-warning">
                                    ⚠️ Contact info redacted
                                  </div>
                                )}
                                <div className="chat-time">{localizeTime(msg.createdAt)}</div>
                              </div>
                            );
                          })
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      <div className="chat-input-bar">
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Type message... (e.g. email me at test@gmail.com)"
                          value={typedMessage}
                          onChange={e => setTypedMessage(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSendMessage(null);
                            }
                          }}
                        />
                        <button type="button" className="btn btn-primary" onClick={() => handleSendMessage(null)}>
                          Send
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Sidebar Timeline Trackers and Audit logs */}
                <div>
                  <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                      Lifecycle Tracker
                    </h3>
                    <div className="timeline-tracker">
                      <div className={`timeline-step ${
                        activeAssignment.status === 'PENDING_PAYMENT' ? 'active' : 'completed'
                      }`}>
                        <div className="timeline-marker">1</div>
                        <div className="timeline-content">
                          <div className="timeline-title">Submitted</div>
                          <div className="timeline-desc">Awaiting fee deposit</div>
                        </div>
                      </div>

                      <div className={`timeline-step ${
                        activeAssignment.status === 'PAID' ? 'active' : 
                        ['PENDING_PAYMENT'].includes(activeAssignment.status) ? '' : 'completed'
                      }`}>
                        <div className="timeline-marker">2</div>
                        <div className="timeline-content">
                          <div className="timeline-title">Paid</div>
                          <div className="timeline-desc">Awaiting expert assign</div>
                        </div>
                      </div>

                      <div className={`timeline-step ${
                        ['ASSIGNED', 'REQUIREMENT_MEETING'].includes(activeAssignment.status) ? 'active' : 
                        ['PENDING_PAYMENT', 'PAID'].includes(activeAssignment.status) ? '' : 'completed'
                      }`}>
                        <div className="timeline-marker">3</div>
                        <div className="timeline-content">
                          <div className="timeline-title">Requirement Session</div>
                          <div className="timeline-desc">Align tutoring scopes</div>
                        </div>
                      </div>

                      <div className={`timeline-step ${
                        ['IN_PROGRESS', 'ADMIN_REVIEW', 'REVISION_REQUIRED'].includes(activeAssignment.status) ? 'active' : 
                        ['PENDING_PAYMENT', 'PAID', 'ASSIGNED', 'REQUIREMENT_MEETING', 'REQUIREMENT_CONFIRMED'].includes(activeAssignment.status) ? '' : 'completed'
                      }`}>
                        <div className="timeline-marker">4</div>
                        <div className="timeline-content">
                          <div className="timeline-title">In Progress / QA Review</div>
                          <div className="timeline-desc">Draft tutorials & audits</div>
                        </div>
                      </div>

                      <div className={`timeline-step ${
                        ['COMPLETED', 'EXPLANATION_MEETING'].includes(activeAssignment.status) ? 'active' : 
                        ['PENDING_PAYMENT', 'PAID', 'ASSIGNED', 'REQUIREMENT_MEETING', 'REQUIREMENT_CONFIRMED', 'IN_PROGRESS', 'ADMIN_REVIEW', 'REVISION_REQUIRED'].includes(activeAssignment.status) ? '' : 'completed'
                      }`}>
                        <div className="timeline-marker">5</div>
                        <div className="timeline-content">
                          <div className="timeline-title">Walkthrough Explanation</div>
                          <div className="timeline-desc">Walkthrough tutoring materials</div>
                        </div>
                      </div>

                      <div className={`timeline-step ${
                        ['DELIVERED', 'CLOSED'].includes(activeAssignment.status) ? 'completed' : ''
                      }`}>
                        <div className="timeline-marker">6</div>
                        <div className="timeline-content">
                          <div className="timeline-title">Delivered & Paid Out</div>
                          <div className="timeline-desc">Academic tutorial closed</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audit Logs */}
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                      Project History (Audit Trail)
                    </h3>
                    <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {auditTrail.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No history logged yet</p>
                      ) : (
                        auditTrail.map(log => (
                          <div key={log.id} style={{
                            padding: '0.75rem',
                            background: 'rgba(0,0,0,0.01)',
                            border: '1px solid var(--border-glass)',
                            borderRadius: 'var(--radius-sm)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-primary)' }}>{log.action}</span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{localizeTime(log.createdAt)}</span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{log.description}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Instant Toast Notification */}
      {paymentToast && (
        <div className="toast-popup">
          <div style={{ fontSize: '1.5rem' }}>🎉</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--accent-success)' }}>
              {paymentToast.title}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {paymentToast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPaymentToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Pop-up Notification Modal for Payment Successful */}
      {paymentSuccessModal && (
        <div className="modal-overlay" onClick={() => setPaymentSuccessModal(null)}>
          <div className="payment-popup-card" onClick={e => e.stopPropagation()}>
            <div className="payment-popup-header">
              <div className="payment-success-icon">✓</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Payment Successful</h2>
              <p style={{ fontSize: '0.85rem', opacity: 0.95, marginTop: '0.25rem' }}>
                Your tutoring deposit has been confirmed.
              </p>
            </div>

            <div className="payment-popup-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-glass)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Amount Paid:</span>
                <strong style={{ color: 'var(--accent-success)', fontSize: '1.15rem' }}>${paymentSuccessModal.amount.toFixed(2)} USD</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Project Topic:</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{paymentSuccessModal.assignmentTitle}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Transaction Reference:</span>
                <span style={{ fontFamily: 'monospace' }}>{paymentSuccessModal.txnId}</span>
              </div>

              {/* Clean Success Message Banner */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                margin: '1.25rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '1.4rem' }}>🎉</span>
                <div style={{ fontSize: '0.82rem', color: '#065f46', lineHeight: '1.4' }}>
                  <strong>Payment Received!</strong> Your order has been placed. An expert tutor is being assigned to your project.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '0.9rem', padding: '0.65rem 1.25rem', fontWeight: '600' }}
                  onClick={() => setPaymentSuccessModal(null)}
                >
                  Continue to Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Meeting Details & Notes Modal */}
      {selectedMeeting && (
        <div className="modal-overlay" onClick={() => setSelectedMeeting(null)}>
          <div className="modal-container" style={{ maxWidth: '780px', width: '92vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <span className="badge badge-info">{selectedMeeting.typeLabel || selectedMeeting.type}</span>
                  {getMeetingStatusBadge(selectedMeeting.status)}
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  {selectedMeeting.title}
                </h3>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                onClick={() => setSelectedMeeting(null)}
              >
                ✕ Close
              </button>
            </div>

            {/* Session Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-glass)' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Student</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <div className="user-avatar-circle" style={{ width: '28px', height: '28px', fontSize: '0.7rem' }}>
                    {selectedMeeting.studentName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{selectedMeeting.studentName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{selectedMeeting.studentEmail}</div>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Expert Mentor</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <div className="user-avatar-circle" style={{ width: '28px', height: '28px', fontSize: '0.7rem', background: '#6366f1' }}>
                    {selectedMeeting.expertName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EX'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{selectedMeeting.expertName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{selectedMeeting.expertEmail}</div>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date, Time & Duration</span>
                <div style={{ fontWeight: '600', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                  📅 {localizeDate(selectedMeeting.scheduledAt)} • {localizeTimeOnly(selectedMeeting.scheduledAt)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  ⏱️ {selectedMeeting.durationMinutes || 45} minutes session
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Platform & Access</span>
                <div style={{ fontWeight: '600', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                  {getPlatformIcon(selectedMeeting.platform)}
                </div>
                {selectedMeeting.meetingLink && (
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                    <a
                      href={selectedMeeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                    >
                      Open Link
                    </a>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                      onClick={() => {
                        navigator.clipboard.writeText(selectedMeeting.meetingLink);
                        alert('Meeting link copied to clipboard!');
                      }}
                    >
                      Copy Link
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Purpose */}
            {selectedMeeting.purpose && (
              <div style={{ marginBottom: '1.5rem', background: '#ffffff', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Purpose & Objectives</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.35rem', lineHeight: '1.5' }}>
                  {selectedMeeting.purpose}
                </p>
              </div>
            )}

            {/* Interactive Notes Form */}
            <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>
                  📝 Meeting Discussion Notes & Action Items
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Editable by Admin & Expert
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>1. Discussion Summary</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Key discussion topics, questions asked, and points covered during the mentorship session..."
                    value={meetingNotesForm.discussionSummary}
                    onChange={e => setMeetingNotesForm({ ...meetingNotesForm, discussionSummary: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>2. Student Requirements / Preferences</label>
                    <textarea
                      className="form-textarea"
                      rows="2"
                      placeholder="Student targets, university choices, timeline..."
                      value={meetingNotesForm.studentRequirements}
                      onChange={e => setMeetingNotesForm({ ...meetingNotesForm, studentRequirements: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>3. Expert Recommendations & Guidance</label>
                    <textarea
                      className="form-textarea"
                      rows="2"
                      placeholder="Mentor advice, test prep, SOP recommendations..."
                      value={meetingNotesForm.recommendations}
                      onChange={e => setMeetingNotesForm({ ...meetingNotesForm, recommendations: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>4. Follow-up Actions & Deliverables</label>
                    <textarea
                      className="form-textarea"
                      rows="2"
                      placeholder="Tasks to be completed before next session..."
                      value={meetingNotesForm.followUpActions}
                      onChange={e => setMeetingNotesForm({ ...meetingNotesForm, followUpActions: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>5. Next Meeting Date / Target</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 28 Aug 2026 or Next Monday 6 PM"
                        value={meetingNotesForm.nextMeetingDate}
                        onChange={e => setMeetingNotesForm({ ...meetingNotesForm, nextMeetingDate: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Session Status</label>
                      <select
                        className="form-input"
                        value={meetingNotesForm.status}
                        onChange={e => setMeetingNotesForm({ ...meetingNotesForm, status: e.target.value })}
                      >
                        <option value="UPCOMING">Upcoming</option>
                        <option value="LIVE">Live Now</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="NO_SHOW">No Show</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedMeeting(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontWeight: '700' }}
                    onClick={() => handleUpdateMeetingNotes(selectedMeeting.id)}
                  >
                    💾 Save Notes & Update Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule New Meeting Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-container" style={{ maxWidth: '640px', width: '92vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>
                ➕ Schedule New Mentorship Meeting
              </h3>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                onClick={() => setShowScheduleModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleNewMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Meeting Title *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. University Selection & Profile Evaluation"
                  value={newMeetingForm.title}
                  onChange={e => setNewMeetingForm({ ...newMeetingForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Student Attendee *</label>
                  <select
                    className="form-input"
                    required
                    value={newMeetingForm.studentId}
                    onChange={e => setNewMeetingForm({ ...newMeetingForm, studentId: e.target.value })}
                  >
                    <option value="">-- Select Student --</option>
                    {studentsList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Expert Mentor</label>
                  <select
                    className="form-input"
                    value={newMeetingForm.expertId}
                    onChange={e => setNewMeetingForm({ ...newMeetingForm, expertId: e.target.value })}
                  >
                    <option value="">-- Auto-assign / Select Expert --</option>
                    {expertsList.map(exp => (
                      <option key={exp.id} value={exp.id}>{exp.name} ({exp.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Meeting Type *</label>
                  <select
                    className="form-input"
                    value={newMeetingForm.type}
                    onChange={e => setNewMeetingForm({ ...newMeetingForm, type: e.target.value })}
                  >
                    <option value="REQUIREMENT_DISCUSSION">Requirement Discussion</option>
                    <option value="ACADEMIC_COUNSELING">Academic Counseling</option>
                    <option value="TUTORING_SESSION">Tutoring Session</option>
                    <option value="MOCK_INTERVIEW">Mock Interview</option>
                    <option value="UNIVERSITY_SELECTION">University Selection</option>
                    <option value="APPLICATION_GUIDANCE">Application Guidance</option>
                    <option value="EXPLANATION">Solution Walkthrough</option>
                    <option value="FOLLOW_UP_MEETING">Follow-up Meeting</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Meeting Platform *</label>
                  <select
                    className="form-input"
                    value={newMeetingForm.platform}
                    onChange={e => setNewMeetingForm({ ...newMeetingForm, platform: e.target.value })}
                  >
                    <option value="Zoom">Zoom Room</option>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Jitsi">Jitsi Meet (In-Browser)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    required
                    value={newMeetingForm.scheduledAt}
                    onChange={e => setNewMeetingForm({ ...newMeetingForm, scheduledAt: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (Minutes)</label>
                  <select
                    className="form-input"
                    value={newMeetingForm.durationMinutes}
                    onChange={e => setNewMeetingForm({ ...newMeetingForm, durationMinutes: Number(e.target.value) })}
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Session Purpose / Agenda</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  placeholder="Outline the objectives, topics to discuss, or prep requirements..."
                  value={newMeetingForm.purpose}
                  onChange={e => setNewMeetingForm({ ...newMeetingForm, purpose: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: '700' }}
                >
                  📅 Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
