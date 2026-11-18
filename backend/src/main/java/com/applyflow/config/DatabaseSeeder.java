package com.applyflow.config;

import com.applyflow.application.entity.ApplicationActivity;
import com.applyflow.application.entity.ApplicationStatus;
import com.applyflow.application.entity.Assessment;
import com.applyflow.application.entity.AssessmentStatus;
import com.applyflow.application.entity.EmploymentType;
import com.applyflow.application.entity.Interview;
import com.applyflow.application.entity.InterviewOutcome;
import com.applyflow.application.entity.JobApplication;
import com.applyflow.application.entity.ProcessStage;
import com.applyflow.application.entity.Reminder;
import com.applyflow.application.entity.ReminderType;
import com.applyflow.application.entity.WorkArrangement;
import com.applyflow.application.repository.ApplicationActivityRepository;
import com.applyflow.application.repository.AssessmentRepository;
import com.applyflow.application.repository.InterviewRepository;
import com.applyflow.application.repository.JobApplicationRepository;
import com.applyflow.application.repository.ReminderRepository;
import com.applyflow.company.entity.Company;
import com.applyflow.company.repository.CompanyRepository;
import com.applyflow.user.entity.User;
import com.applyflow.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@Profile("dev")
@ConditionalOnProperty(name = "SEED_DEMO_DATA", havingValue = "true")
public class DatabaseSeeder implements CommandLineRunner {
    public static final String DEMO_EMAIL = "demo@applyflow.dev";
    public static final String DEMO_PASSWORD = "ApplyFlow123!";

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final JobApplicationRepository applicationRepository;
    private final ApplicationActivityRepository activityRepository;
    private final InterviewRepository interviewRepository;
    private final AssessmentRepository assessmentRepository;
    private final ReminderRepository reminderRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(UserRepository userRepository,
                          CompanyRepository companyRepository,
                          JobApplicationRepository applicationRepository,
                          ApplicationActivityRepository activityRepository,
                          InterviewRepository interviewRepository,
                          AssessmentRepository assessmentRepository,
                          ReminderRepository reminderRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.applicationRepository = applicationRepository;
        this.activityRepository = activityRepository;
        this.interviewRepository = interviewRepository;
        this.assessmentRepository = assessmentRepository;
        this.reminderRepository = reminderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        User user = userRepository.findByEmailIgnoreCase(DEMO_EMAIL).orElseGet(() ->
                userRepository.save(new User(
                        DEMO_EMAIL,
                        passwordEncoder.encode(DEMO_PASSWORD),
                        "Alex Morgan"
                ))
        );

        if (applicationRepository.countByUserId(user.getId()) > 0) {
            return;
        }

        LocalDate now = LocalDate.now();

        Company linear = company("Linear", "https://linear.app", "Technology", "Remote", user);
        Company notion = company("Notion", "https://notion.so", "Technology", "Hybrid", user);
        Company spotify = company("Spotify", "https://spotify.com", "Technology", "Stockholm", user);
        Company stripe = company("Stripe", "https://stripe.com", "Fintech", "San Francisco", user);
        Company figma = company("Figma", "https://figma.com", "Design", "Remote", user);

        JobApplication linearApp = application(user, linear, "Senior Product Designer",
                "Lead product discovery and end-to-end design for the Linear platform.",
                "https://linear.app/careers", "Remote", EmploymentType.FULL_TIME,
                WorkArrangement.REMOTE, ApplicationStatus.IN_PROCESS, ProcessStage.FINAL_INTERVIEW,
                now.minusDays(18), "145000", "Product Design v4",
                "Prepare a portfolio walkthrough and align on the design system.");

        JobApplication notionApp = application(user, notion, "Product Designer",
                "Design collaborative workplace experiences for modern teams.",
                "https://notion.so/careers", "New York, NY", EmploymentType.FULL_TIME,
                WorkArrangement.HYBRID, ApplicationStatus.IN_PROCESS, ProcessStage.HR_INTERVIEW,
                now.minusDays(12), "138000", "Product Design v4",
                "Research the current collaboration workflow before the recruiter call.");

        JobApplication spotifyApp = application(user, spotify, "UX Engineer",
                "Prototype and build user-facing experiences across Spotify products.",
                "https://spotifyjobs.com", "Stockholm", EmploymentType.FULL_TIME,
                WorkArrangement.HYBRID, ApplicationStatus.IN_PROCESS, ProcessStage.ASSESSMENT,
                now.minusDays(9), "125000", "UX Engineer v2",
                "Complete the technical prototype within three days.");

        JobApplication stripeApp = application(user, stripe, "Product Designer",
                "Create intuitive financial tools for global businesses.",
                "https://stripe.com/jobs", "San Francisco, CA", EmploymentType.FULL_TIME,
                WorkArrangement.ONSITE, ApplicationStatus.HIRED, null,
                now.minusDays(45), "152000", "Product Design v4",
                "Review compensation and benefits before responding.");

        JobApplication figmaApp = application(user, figma, "Design Systems Designer",
                "Build scalable design systems and collaboration tools.",
                "https://figma.com/careers", "Remote", EmploymentType.FULL_TIME,
                WorkArrangement.REMOTE, ApplicationStatus.REJECTED, null,
                now.minusDays(62), "148000", "Design Systems v3",
                "Ask for feedback and use the interview notes for future applications.");

        JobApplication linearTech = application(user, linear, "Staff Product Designer",
                "Own complex workflows and raise the quality bar across teams.",
                "https://linear.app/careers", "Remote", EmploymentType.FULL_TIME,
                WorkArrangement.REMOTE, ApplicationStatus.IN_PROCESS, ProcessStage.TECHNICAL_INTERVIEW,
                now.minusDays(26), "170000", "Senior Portfolio v5",
                "Technical product critique scheduled for next week.");

        application(user, notion, "UX Researcher",
                "Plan and run mixed-method research studies.",
                "https://notion.so/careers", "New York, NY", EmploymentType.CONTRACT,
                WorkArrangement.HYBRID, ApplicationStatus.APPLIED, null,
                now.minusDays(5), "110000", "Research v2",
                "Follow up after one week.");

        application(user, spotify, "Design Technologist",
                "Explore experimental tools and product prototypes.",
                "https://spotifyjobs.com", "Remote", EmploymentType.CONTRACT,
                WorkArrangement.REMOTE, ApplicationStatus.WISHLIST, null,
                now.minusDays(2), "115000", "Design Technologist v1",
                "Review the role requirements before applying.");

        application(user, stripe, "Senior UI Designer",
                "Improve core dashboard experiences for Stripe users.",
                "https://stripe.com/jobs", "Remote", EmploymentType.FULL_TIME,
                WorkArrangement.REMOTE, ApplicationStatus.HIRED, null,
                now.minusMonths(3), "160000", "UI Design v5",
                "Onboarding completed.");

        activity(linearApp, "STATUS_CHANGED", "Status changed from IN_PROCESS (TECHNICAL_INTERVIEW) to IN_PROCESS (FINAL_INTERVIEW).", now.minusDays(2));
        activity(notionApp, "STATUS_CHANGED", "Status changed from IN_PROCESS (ASSESSMENT) to IN_PROCESS (HR_INTERVIEW).", now.minusDays(1));
        activity(spotifyApp, "STATUS_CHANGED", "Status changed from APPLIED to IN_PROCESS (ASSESSMENT).", now.minusDays(3));
        activity(stripeApp, "STATUS_CHANGED", "Status changed from IN_PROCESS (FINAL_INTERVIEW) to HIRED.", now.minusDays(7));

        interview(linearApp, now.plusDays(2).atTime(10, 30).toInstant(java.time.ZoneOffset.UTC),
                "Final interview", "Maya Chen", "maya.chen@linear.app",
                "https://meet.google.com/demo-linear", "Review portfolio stories and product philosophy.",
                "Strong systems-thinking examples; prepare questions for the VP.", InterviewOutcome.PENDING);

        interview(notionApp, now.plusDays(5).atTime(15, 0).toInstant(java.time.ZoneOffset.UTC),
                "HR interview", "Daniel Ross", "daniel.ross@notion.so",
                "https://zoom.us/demo-notion", "Prepare collaboration examples and compensation range.",
                null, InterviewOutcome.PENDING);

        interview(spotifyApp, now.minusDays(4).atTime(14, 0).toInstant(java.time.ZoneOffset.UTC),
                "Technical interview", "Aisha Patel", "aisha.patel@spotify.com",
                "https://meet.google.com/demo-spotify", "Review React, accessibility, and data visualization.",
                "The interviewer was engaged and technical depth was strong.", InterviewOutcome.PASSED);

        interview(stripeApp, now.minusDays(12).atTime(11, 0).toInstant(java.time.ZoneOffset.UTC),
                "Final interview", "Jordan Lee", "jordan.lee@stripe.com",
                "https://zoom.us/demo-stripe", "Prepare system design and leadership examples.",
                "Received positive feedback and the role moved to offer.", InterviewOutcome.PASSED);

        assessment(spotifyApp, "Frontend Prototype", "Coding assessment",
                "Build an accessible prototype using the supplied dataset. Include keyboard navigation.",
                now.plusDays(3).atTime(18, 0).toInstant(java.time.ZoneOffset.UTC),
                AssessmentStatus.IN_PROGRESS, null, "Use the existing React starter repository.");

        assessment(linearTech, "Product Critique", "Technical assessment",
                "Review the supplied workflow and present three concrete improvement proposals.",
                now.plusDays(7).atTime(18, 0).toInstant(java.time.ZoneOffset.UTC),
                AssessmentStatus.NOT_STARTED, null, "Prepare a 20-minute presentation.");

        assessment(stripeApp, "Portfolio Exercise", "Case study",
                "Complete the dashboard case study and document the decision-making process.",
                now.minusDays(20).atTime(18, 0).toInstant(java.time.ZoneOffset.UTC),
                AssessmentStatus.COMPLETED, "Excellent brief and clear trade-offs.",
                "Submitted before the deadline.");

        reminder(user, linearApp, "Prepare final interview",
                "Review portfolio stories and Linear design principles.",
                ReminderType.UPCOMING_INTERVIEW, now.plusDays(1).atTime(9, 0).toInstant(java.time.ZoneOffset.UTC));

        reminder(user, notionApp, "Recruiter follow-up",
                "Send a short thank-you note after the HR interview.",
                ReminderType.RECRUITER_FOLLOW_UP, now.plusDays(6).atTime(9, 0).toInstant(java.time.ZoneOffset.UTC));

        reminder(user, spotifyApp, "Submit coding assessment",
                "Finish and submit the React prototype.",
                ReminderType.ASSESSMENT_DEADLINE, now.plusDays(3).atTime(18, 0).toInstant(java.time.ZoneOffset.UTC));

        reminder(user, figmaApp, "Request application feedback",
                "Ask whether the recruiter can share concise feedback.",
                ReminderType.RECRUITER_FOLLOW_UP, now.minusDays(2).atTime(10, 0).toInstant(java.time.ZoneOffset.UTC));

        reminder(user, stripeApp, "Review offer package",
                "Compare salary, equity, bonus, and benefits.",
                ReminderType.CUSTOM, now.minusDays(1).atTime(16, 0).toInstant(java.time.ZoneOffset.UTC));
    }

    private Company company(String name, String website, String industry, String location, User user) {
        return companyRepository.save(new Company(user, name, website, industry, location,
                "Demo company used to populate the ApplyFlow preview."));
    }

    private JobApplication application(User user, Company company, String position,
                                       String description, String url, String location,
                                       EmploymentType employmentType, WorkArrangement arrangement,
                                       ApplicationStatus status, ProcessStage processStage, LocalDate appliedAt,
                                       String salary, String resumeVersion, String notes) {
        return applicationRepository.save(new JobApplication(
                user, company, position, description, url, location, employmentType,
                arrangement, status, processStage, appliedAt, new BigDecimal(salary),
                null, resumeVersion, notes
        ));
    }

    private void activity(JobApplication application, String type, String description, LocalDate date) {
        activityRepository.save(new ApplicationActivity(
                application, type, description,
                date.atTime(12, 0).toInstant(java.time.ZoneOffset.UTC)
        ));
    }

    private void interview(JobApplication application, Instant scheduledAt, String type,
                           String interviewer, String contact, String location,
                           String preparation, String reflection, InterviewOutcome outcome) {
        interviewRepository.save(new Interview(application, scheduledAt, type, interviewer,
                contact, location, preparation, reflection, outcome));
    }

    private void assessment(JobApplication application, String title, String type,
                            String instructions, Instant dueAt, AssessmentStatus status,
                            String result, String notes) {
        assessmentRepository.save(new Assessment(application, title, type, instructions,
                dueAt, status, result, notes));
    }

    private void reminder(User user, JobApplication application, String title,
                          String description, ReminderType type, Instant remindAt) {
        Reminder reminder = new Reminder(user, application, title, description, type, remindAt);
        if (remindAt.isBefore(Instant.now()) && !title.equals("Review offer package")) {
            reminder.markOverdue();
        }
        reminderRepository.save(reminder);
    }
}
