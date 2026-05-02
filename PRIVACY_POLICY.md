# Privacy Policy for DigiWell

**Last Updated:** April 25, 2026

## Introduction

DigiWell ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.

## Information We Collect

### Personal Information
- **Email Address**: Used for account creation and authentication
- **Profile Information**: Nickname, age, gender, height, weight, activity level
- **Health Data**: Daily water intake, hydration goals, activity tracking
- **AI Feature Inputs**: Messages you send to DigiCoach AI, optional drink photos you upload for scan, and the hydration context needed to answer your request

### Automatically Collected Information
- **Device Information**: Device type, operating system version
- **Usage Data**: App features used, interaction patterns
- **Location Data** (Optional): Approximate location for weather-based hydration recommendations

## How We Use Your Information

We use the collected information to:
- Provide personalized hydration recommendations
- Track your daily water intake and progress
- Send reminder notifications
- Improve app functionality and user experience
- Provide AI-powered health insights, chat assistance, and drink image analysis via our server-side AI gateway

## Third-Party Services

We use the following third-party services:

### Supabase (Database & Authentication)
- **Purpose**: Store user data and handle authentication
- **Data Shared**: Email, profile information, water intake logs, and authenticated requests to our server-side AI gateway
- **Privacy Policy**: https://supabase.com/privacy

### Groq (AI Inference Provider)
- **Purpose**: Process DigiCoach AI chat, hydration insights, weekly report analysis, and drink image scan requests
- **Data Shared**: The content you submit to AI features, which may include hydration metrics, profile context you provided, optional weather/watch/calendar summary, and drink images you choose to upload
- **Privacy Policy**: https://groq.com/privacy-policy/

### Meta Llama Models
- **Purpose**: The language and vision models used by DigiCoach AI through Groq infrastructure
- **Data Shared**: Processed through Groq as part of the AI request flow described above
- **Applicable Policy**: https://www.llama.com/llama3/use-policy/

### Google Calendar API (Optional)
- **Purpose**: Sync calendar events for activity-based hydration goals
- **Data Shared**: Calendar event titles and times (read-only)
- **Privacy Policy**: https://policies.google.com/privacy

## Data Storage and Security

- All data is encrypted in transit using HTTPS/TLS
- Passwords are hashed and never stored in plain text
- Data is stored on secure Supabase servers
- Health profile data, hydration logs, and account data are stored in Supabase
- AI requests are routed through a Supabase Edge Function (`ai-gateway`) before being sent to Groq for inference
- In the current app flow, DigiWell does not intentionally persist full AI chat transcripts in its main application database by default; AI chat content is primarily handled in-session to generate a response
- We implement industry-standard security measures

## Your Rights

You have the right to:
- **Access**: Request a copy of your personal data
- **Correction**: Update or correct your information
- **Deletion**: Request deletion of your account and data
- **Export**: Download your data in a portable format

To exercise these rights, contact us at: **support@digiwell.app**

## Data Retention

- Active accounts: Data retained as long as account is active
- Deleted accounts: Data permanently deleted within 30 days
- Backup data: Removed from backups within 90 days
- AI request payloads are sent for real-time processing; DigiWell does not describe them as a long-term chat archive in the current app flow unless a future feature explicitly adds that behavior

## Children's Privacy

DigiWell is not intended for children under 13. We do not knowingly collect data from children under 13. If you believe we have collected such data, please contact us immediately.

## Push Notifications

We send local notifications to remind you to stay hydrated. You can disable these in your device settings at any time.

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of significant changes via:
- In-app notification
- Email to your registered address

## Contact Us

If you have questions about this Privacy Policy, please contact:

**Email**: support@digiwell.app  
**Developer**: Van Lang University - Digital Citizen Project  
**Address**: Ho Chi Minh City, Vietnam

## Published Policy

This Privacy Policy is published online at:
**https://digiwell.app/privacy**

## Consent

By using DigiWell, you consent to this Privacy Policy and agree to its terms.
