# I-Team Society Management System - Complete User Guide

## 🎯 System Overview

The I-Team Society Management System is a comprehensive web application designed for The Open University of Sri Lanka's Computer Science Department student society. It provides role-based access for Students, Staff, and Administrators with complete membership management, event organization, and digital identity features.

## 🚀 Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Email access for account verification

### Accessing the System
1. Open your web browser
2. Navigate to the application URL
3. You'll see the I-Team Society homepage

## 👥 User Roles & Registration

### 1. Student Registration
**URL**: `/register-student`

**Requirements**:
- Valid student ID from OUSL
- Academic level (1, 2, 3, or 4+)
- Payment slip upload (mandatory)
- Profile photo (optional)

**Process**:
1. Click "Register as Student" from the main registration page
2. Fill in basic information (name, email, phone, password)
   - **Phone Number**: Enter in any format you prefer (local, international, with/without spaces)
3. Complete student details (student ID, degree, level)
4. Upload payment slip (image or PDF)
5. Upload profile photo (optional)
6. Agree to terms and submit
7. Check email for verification link
8. Wait for admin approval

**Membership Fees**:
- Level 1: Rs. 500 (Bronze)
- Level 2: Rs. 1000 (Silver)
- Level 3+: Rs. 1500 (Gold)

### 2. Staff Registration
**URL**: `/register-staff`

**Requirements**:
- Valid staff ID from OUSL
- Position/designation
- No payment slip required initially

**Process**:
1. Click "Register as Staff" from the main registration page
2. Fill in basic information
3. Complete staff details (staff ID, position)
4. Choose membership type (1 year, 2 year, lifetime)
5. Upload profile photo (optional)
6. Submit registration
7. Complete payment later from dashboard

**Membership Options**:
- 1 Year: Rs. 500 (Bronze)
- 2 Year: Rs. 1000 (Silver)
- Lifetime: Rs. 1500 (Gold)

### 3. Admin Registration
**URL**: `/register-admin`

**Requirements**:
- Admin registration code: `ITEAM2025ADMIN`
- Valid staff credentials
- Authorization from system administrator

**Process**:
1. Click "Register as Administrator"
2. Enter admin registration code
3. Fill in all required information
4. Submit for immediate activation
5. Receive full administrative access

## 📱 Dashboard Features

### Student Dashboard
**Access**: After login with student account

**Features**:
- **Overview**: Personal statistics and membership status
- **Events**: Browse and register for available events
- **My Events**: Track registered events and attendance
- **E-ID Card**: Download digital membership card with QR code
- **Notifications**: Real-time updates and announcements

**Key Actions**:
- Register for events
- View attendance history
- Download E-ID card
- Update profile information
- Track membership status

### Staff Dashboard
**Access**: After login with staff account

**Features**:
- **Overview**: Event management statistics
- **Available Events**: Join events as a participant
- **My Events**: Events you're attending
- **Event Management**: Create and manage your events
- **E-ID Card**: Professional membership card
- **Notifications**: System updates and event notifications

**Key Actions**:
- Create new events
- Manage event registrations
- Mark attendance for events
- Join other events
- Download E-ID card

### Admin Dashboard
**Access**: After login with admin account

**Features**:
- **Overview**: System-wide statistics and analytics
- **Membership Approvals**: Review and approve student memberships
- **Event Management**: Oversee all events in the system
- **User Management**: Complete user administration
- **Payment Verification**: Review and approve payments

**Key Actions**:
- Approve/reject membership applications
- Verify payment slips
- Manage all users
- Oversee all events
- Generate system reports

## 🎫 Event Management

### For Staff (Event Creation)
1. Go to Staff Dashboard
2. Click "Create Event" or use Event Management tab
3. Fill in event details:
   - Title and description
   - Date and time
   - Location
   - Maximum participants
   - Event poster (optional)
4. Submit for publication
5. Manage registrations and attendance

### For Students/Staff (Event Registration)
1. Browse available events in dashboard
2. Click "Register" on desired event
3. Confirm registration
4. Receive confirmation notification
5. Attend event and get QR code scanned for attendance

### Attendance Tracking
- QR code-based attendance system
- Real-time attendance marking
- Attendance history tracking
- Automated attendance reports

## 🆔 E-ID System

### E-ID Generation
- Automatic generation upon membership approval
- Format: ITS/YEAR/ROLE/SEQUENCE
- Example: ITS/2025/STU/0001

### E-ID Card Features
- Professional membership card design
- QR code for verification
- Member photo and details
- Validity period
- Downloadable PDF format

### QR Code Verification
- Scan QR code to view member profile
- Public verification page
- Real-time membership status
- Secure member information display

## 💳 Payment & Membership

### Payment Process
1. **Students**: Upload payment slip during registration
2. **Staff**: Complete payment after registration
3. **Admin**: Verify and approve payments
4. **System**: Auto-generate E-ID upon approval

### Membership Status
- **Pending Payment**: Awaiting payment submission
- **Pending Approval**: Payment submitted, awaiting admin review
- **Active**: Approved membership with full access
- **Expired**: Membership period ended

### Payment Verification (Admin)
1. Access Admin Dashboard
2. Go to Membership Approvals
3. Review payment slips
4. Verify payment details
5. Approve or reject with comments
6. System auto-generates E-ID for approved members

## 🔔 Notification System

### Types of Notifications
- Membership approval/rejection
- Event announcements
- Registration confirmations
- Payment reminders
- System updates

### Managing Notifications
- Real-time notifications in dashboard
- Mark as read/unread
- Delete unwanted notifications
- Email notifications for important updates

## 🔧 System Administration

### User Management (Admin Only)
- View all registered users
- Edit user information
- Manage user roles
- Deactivate/reactivate accounts
- Export user data

### Membership Management
- Bulk membership operations
- Membership renewal
- Status updates
- Payment tracking
- E-ID regeneration

### Event Oversight
- Monitor all events
- Event approval workflow
- Attendance analytics
- Event performance metrics

## 📊 Analytics & Reporting

### Available Reports
- Membership statistics
- Event attendance reports
- Payment tracking
- User activity analytics
- System usage metrics

### Accessing Reports (Admin)
1. Login to Admin Dashboard
2. Navigate to Analytics section
3. Select report type
4. Choose date range
5. Generate and download reports

## 🔒 Security Features

### Account Security
- Email verification required
- Secure password requirements
- Role-based access control
- Session management
- Audit logging

### Data Protection
- Secure file storage
- Encrypted data transmission
- Privacy controls
- GDPR compliance features
- Regular security updates

## 📞 Support & Troubleshooting

### Common Issues

**Login Problems**:
- Verify email address
- Check password
- Ensure account is verified
- Contact admin if locked

**Registration Issues**:
- Check all required fields
- Verify file upload formats
- Ensure payment slip is clear
- Contact support for assistance

**E-ID Problems**:
- Ensure membership is active
- Check browser compatibility
- Clear browser cache
- Contact admin for regeneration

### Getting Help
- Contact system administrator
- Email support team
- Check FAQ section
- Submit support ticket through dashboard

## 🎯 Best Practices

### For Students
- Keep membership active
- Register early for popular events
- Upload clear payment slips
- Update profile information regularly
- Check notifications frequently

### For Staff
- Create detailed event descriptions
- Set appropriate participant limits
- Mark attendance promptly
- Engage with student events
- Maintain professional profiles

### For Admins
- Review payments promptly
- Monitor system performance
- Respond to user queries quickly
- Maintain data backups
- Update system regularly

## 📈 Future Enhancements

### Planned Features
- Mobile application
- Advanced analytics
- Integration with university systems
- Automated payment processing
- Enhanced communication tools

---

**System Version**: 1.0.0  
**Last Updated**: December 2024  
**Support Contact**: iteam@ousl.lk  
**Technical Support**: Available 24/7
