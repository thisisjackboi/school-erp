"use client";

import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const styles = `
  :root {
    --pp-primary: #2563eb;
    --pp-text: #1f2937;
    --pp-muted: #6b7280;
    --pp-heading: #111827;
    --pp-border: #e5e7eb;
    --pp-background: #f8fafc;
    --pp-card: #ffffff;
  }

  .pp-body {
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Helvetica, Arial, sans-serif;
    background: var(--pp-background);
    color: var(--pp-text);
    line-height: 1.7;
  }

  .pp-body a {
    color: var(--pp-primary);
    text-decoration: none;
  }

  .pp-body a:hover {
    text-decoration: underline;
  }

  .pp-header {
    background: linear-gradient(135deg, #1d4ed8, #2563eb);
    color: white;
    padding: 70px 20px;
  }

  .pp-header-container {
    max-width: 1000px;
    margin: auto;
  }

  .pp-brand {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 25px;
    opacity: 0.95;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pp-header h1 {
    font-size: clamp(36px, 6vw, 54px);
    line-height: 1.15;
    margin-bottom: 15px;
  }

  .pp-header p {
    max-width: 700px;
    font-size: 17px;
    opacity: 0.9;
  }

  .pp-last-updated {
    margin-top: 25px;
    font-size: 14px;
    opacity: 0.8;
  }

  .pp-layout {
    max-width: 1200px;
    margin: 50px auto;
    padding: 0 20px;
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 50px;
    align-items: start;
  }

  .pp-toc {
    position: sticky;
    top: 30px;
    background: var(--pp-card);
    border: 1px solid var(--pp-border);
    border-radius: 12px;
    padding: 22px;
  }

  .pp-toc h3 {
    font-size: 15px;
    margin-bottom: 12px;
    color: var(--pp-heading);
  }

  .pp-toc ul {
    list-style: none;
  }

  .pp-toc li {
    margin: 8px 0;
  }

  .pp-toc a {
    font-size: 14px;
    color: var(--pp-muted);
  }

  .pp-toc a:hover {
    color: var(--pp-primary);
  }

  .pp-content {
    background: var(--pp-card);
    border: 1px solid var(--pp-border);
    border-radius: 14px;
    padding: 45px;
  }

  .pp-section {
    margin-bottom: 48px;
    scroll-margin-top: 30px;
  }

  .pp-section:last-child {
    margin-bottom: 0;
  }

  .pp-content h2 {
    color: var(--pp-heading);
    font-size: 27px;
    margin-bottom: 16px;
    line-height: 1.3;
  }

  .pp-content h3 {
    color: var(--pp-heading);
    font-size: 19px;
    margin: 25px 0 10px;
  }

  .pp-content p {
    margin-bottom: 14px;
  }

  .pp-content ul {
    padding-left: 22px;
    margin: 12px 0 18px;
  }

  .pp-content li {
    margin-bottom: 8px;
  }

  .pp-notice {
    background: #eff6ff;
    border-left: 4px solid var(--pp-primary);
    padding: 18px 20px;
    border-radius: 6px;
    margin: 20px 0;
  }

  .pp-table-wrapper {
    overflow-x: auto;
    margin: 20px 0;
  }

  .pp-table-wrapper table {
    width: 100%;
    border-collapse: collapse;
    min-width: 600px;
  }

  .pp-table-wrapper th,
  .pp-table-wrapper td {
    border: 1px solid var(--pp-border);
    padding: 12px 14px;
    text-align: left;
    vertical-align: top;
  }

  .pp-table-wrapper th {
    background: #f9fafb;
    color: var(--pp-heading);
    font-weight: 600;
  }

  .pp-footer {
    text-align: center;
    padding: 40px 20px;
    color: var(--pp-muted);
    font-size: 14px;
  }

  @media (max-width: 800px) {
    .pp-layout {
      grid-template-columns: 1fr;
      margin-top: 25px;
    }

    .pp-toc {
      position: static;
    }

    .pp-content {
      padding: 28px 22px;
    }

    .pp-header {
      padding: 50px 20px;
    }
  }
`;

export default function PrivacyPolicyPage() {
  return (
    <div className="pp-body">
      <style>{styles}</style>

      <header className="pp-header">
        <div className="pp-header-container">
          <div className="pp-brand">
            <ShieldCheck className="h-5 w-5" />
            PrismaEd+
          </div>

          <h1>Privacy Policy</h1>

          <p>
            This Privacy Policy explains how PrismaEd+ collects, uses, stores,
            protects, and processes information when schools, administrators,
            guardians, students, employees, and other authorized users use our
            school management and ERP platform.
          </p>

          <div className="pp-last-updated">Last Updated: September 5, 2026</div>
        </div>
      </header>

      <main className="pp-layout">
        <aside className="pp-toc">
          <h3>Contents</h3>

          <ul>
            <li>
              <a href="#introduction">1. Introduction</a>
            </li>
            <li>
              <a href="#information">2. Information We Collect</a>
            </li>
            <li>
              <a href="#roles">3. User Roles</a>
            </li>
            <li>
              <a href="#usage">4. How We Use Information</a>
            </li>
            <li>
              <a href="#sharing">5. Information Sharing</a>
            </li>
            <li>
              <a href="#school-control">6. School Control</a>
            </li>
            <li>
              <a href="#children">7. Children&apos;s Data</a>
            </li>
            <li>
              <a href="#security">8. Data Security</a>
            </li>
            <li>
              <a href="#retention">9. Data Retention</a>
            </li>
            <li>
              <a href="#rights">10. Privacy Rights</a>
            </li>
            <li>
              <a href="#cookies">11. Cookies &amp; Technologies</a>
            </li>
            <li>
              <a href="#third-party">12. Third-Party Services</a>
            </li>
            <li>
              <a href="#transfers">13. Data Transfers</a>
            </li>
            <li>
              <a href="#changes">14. Policy Changes</a>
            </li>
            <li>
              <a href="#contact">15. Contact Us</a>
            </li>
          </ul>
        </aside>

        <article className="pp-content">
          <section className="pp-section" id="introduction">
            <h2>1. Introduction</h2>

            <p>
              Welcome to PrismaEd+ (&quot;PrismaEd+&quot;, &quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;). PrismaEd+ is a school
              management and Enterprise Resource Planning (ERP) platform
              designed to help educational institutions manage academic,
              administrative, communication, financial, attendance,
              transportation, documentation, and related school operations.
            </p>

            <p>
              This Privacy Policy describes how information is collected and
              processed through the PrismaEd+ website, administrative
              dashboard, mobile applications, APIs, and other services provided
              as part of the PrismaEd+ platform.
            </p>

            <div className="pp-notice">
              <strong>Important:</strong>
              PrismaEd+ may be operated on behalf of a school or educational
              institution. In such cases, the school may determine what
              information is collected, how it is used, and how long it is
              retained.
            </div>
          </section>

          <section className="pp-section" id="information">
            <h2>2. Information We Collect</h2>

            <p>
              Depending on the features enabled by the school, PrismaEd+ may
              process the following categories of information.
            </p>

            <h3>2.1 Account Information</h3>

            <ul>
              <li>Name</li>
              <li>Email address</li>
              <li>Mobile phone number</li>
              <li>User ID or employee/student/guardian ID</li>
              <li>Profile photograph, where provided</li>
              <li>Login credentials and authentication information</li>
              <li>User role and account status</li>
            </ul>

            <h3>2.2 Student Information</h3>

            <ul>
              <li>Student name and identification details</li>
              <li>Date of birth</li>
              <li>Class, section, house, and academic information</li>
              <li>Attendance records</li>
              <li>Examination and assessment information</li>
              <li>Academic performance</li>
              <li>School documents and certificates</li>
              <li>Transport-related information</li>
              <li>Other information entered by the authorized school</li>
            </ul>

            <h3>2.3 Guardian Information</h3>

            <ul>
              <li>Guardian name</li>
              <li>Relationship with student</li>
              <li>Contact information</li>
              <li>Address</li>
              <li>Information concerning associated students</li>
              <li>Communication preferences</li>
            </ul>

            <h3>2.4 Employee Information</h3>

            <ul>
              <li>Employee name and identification information</li>
              <li>Department and designation</li>
              <li>Attendance and work-related information</li>
              <li>Contact information</li>
              <li>Documents provided by the school</li>
              <li>Other employment-related information managed by the school</li>
            </ul>

            <h3>2.5 School and Administrative Information</h3>

            <ul>
              <li>School name and contact details</li>
              <li>School configuration and settings</li>
              <li>Academic session information</li>
              <li>Classes, sections, subjects, and departments</li>
              <li>Fee and payment-related records</li>
              <li>School documents</li>
              <li>Administrative records</li>
            </ul>

            <h3>2.6 Technical Information</h3>

            <p>
              We may automatically collect limited technical information when
              the platform is accessed, including:
            </p>

            <ul>
              <li>IP address</li>
              <li>Device type</li>
              <li>Operating system</li>
              <li>Browser or application information</li>
              <li>Application version</li>
              <li>Login and access timestamps</li>
              <li>Error and diagnostic information</li>
              <li>Security and audit logs</li>
            </ul>
          </section>

          <section className="pp-section" id="roles">
            <h2>3. User Roles</h2>

            <p>
              PrismaEd+ uses role-based access controls to help ensure that
              users can access only the information and functionality relevant
              to their role.
            </p>

            <div className="pp-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Typical Access</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>School Administrator</td>
                    <td>
                      School configuration, users, academic records,
                      administrative information, reports, and other functions
                      authorized by the school.
                    </td>
                  </tr>

                  <tr>
                    <td>Guardian</td>
                    <td>
                      Information relating to their associated student(s),
                      including attendance, academic information, fees,
                      notifications, documents, and other enabled services.
                    </td>
                  </tr>

                  <tr>
                    <td>Student</td>
                    <td>
                      Their own academic, attendance, examination, document,
                      communication, and other permitted information.
                    </td>
                  </tr>

                  <tr>
                    <td>Employee</td>
                    <td>
                      Information and functionality required for their assigned
                      responsibilities, subject to school permissions.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              Schools are responsible for configuring appropriate permissions
              and ensuring that users receive access appropriate to their role.
            </p>
          </section>

          <section className="pp-section" id="usage">
            <h2>4. How We Use Information</h2>

            <p>
              Information processed through PrismaEd+ may be used for the
              following purposes:
            </p>

            <ul>
              <li>Creating and managing user accounts</li>
              <li>Authenticating users and securing accounts</li>
              <li>Providing school management and ERP functionality</li>
              <li>Managing student academic records</li>
              <li>Managing attendance</li>
              <li>Managing examinations and assessments</li>
              <li>Managing school fees and financial records</li>
              <li>Managing transportation information</li>
              <li>Managing school documents</li>
              <li>Sending school-related notifications and communications</li>
              <li>Generating reports and administrative information</li>
              <li>Maintaining audit and security logs</li>
              <li>Detecting and preventing unauthorized access</li>
              <li>Improving reliability, security, and performance</li>
              <li>Providing technical support</li>
              <li>Complying with applicable legal obligations</li>
            </ul>

            <p>
              We do not use student or school information for unrelated
              advertising purposes.
            </p>
          </section>

          <section className="pp-section" id="sharing">
            <h2>5. Information Sharing</h2>

            <p>PrismaEd+ does not sell personal information to third parties.</p>

            <p>
              Information may be shared or made accessible only where
              reasonably necessary to provide the service, operate the
              platform, comply with legal requirements, or as directed by the
              relevant educational institution.
            </p>

            <h3>Service Providers</h3>

            <p>
              We may use trusted third-party service providers for services
              such as hosting, cloud infrastructure, authentication,
              notifications, analytics, security, communication, payment
              processing, and technical operations.
            </p>

            <p>
              Such providers may process information only as necessary to
              provide their services and subject to applicable contractual and
              legal requirements.
            </p>

            <h3>Legal Requirements</h3>

            <p>
              We may disclose information where required by applicable law,
              regulation, court order, governmental authority, or where
              necessary to protect the rights, security, or property of
              PrismaEd+, a school, its users, or others.
            </p>
          </section>

          <section className="pp-section" id="school-control">
            <h2>6. School Control and Responsibility</h2>

            <p>
              In many PrismaEd+ deployments, the school or educational
              institution controls the student, guardian, employee, and
              academic information entered into the platform.
            </p>

            <p>The school may determine:</p>

            <ul>
              <li>Which information is collected</li>
              <li>Which users receive access</li>
              <li>Which modules are enabled</li>
              <li>
                How information is used for educational and administrative
                purposes
              </li>
              <li>How long certain records should be retained</li>
            </ul>

            <p>
              Questions regarding school-specific records, access permissions,
              or correction of information may need to be directed to the
              relevant school administrator.
            </p>
          </section>

          <section className="pp-section" id="children">
            <h2>7. Children&apos;s Data</h2>

            <p>
              PrismaEd+ is intended to be used by educational institutions and
              may process information relating to students who are minors.
            </p>

            <p>
              Student accounts and student information are generally created or
              managed by the school and/or authorized guardians. PrismaEd+ does
              not knowingly seek to collect children&apos;s information for
              advertising or unrelated commercial purposes.
            </p>

            <p>
              Schools and guardians are responsible for ensuring that the use
              and disclosure of student information is conducted in accordance
              with applicable laws and institutional policies.
            </p>

            <p>
              If you believe that information relating to a child has been
              collected or processed improperly, please contact the relevant
              school administrator or PrismaEd+ using the contact information
              provided below.
            </p>
          </section>

          <section className="pp-section" id="security">
            <h2>8. Data Security</h2>

            <p>
              We take reasonable technical and organizational measures to
              protect information processed through PrismaEd+.
            </p>

            <p>Depending on the deployment, security measures may include:</p>

            <ul>
              <li>Encrypted communication using HTTPS/TLS</li>
              <li>Authentication and authorization controls</li>
              <li>Role-based access control</li>
              <li>Secure password storage</li>
              <li>Access logging and audit trails</li>
              <li>Infrastructure and database security controls</li>
              <li>Monitoring for unauthorized access</li>
              <li>Regular software and security updates</li>
            </ul>

            <p>
              However, no internet-based service can guarantee absolute
              security. Users should protect their login credentials and
              immediately report suspected unauthorized access.
            </p>
          </section>

          <section className="pp-section" id="retention">
            <h2>9. Data Retention</h2>

            <p>
              Personal information is retained for as long as reasonably
              necessary to provide the PrismaEd+ services, maintain school
              records, satisfy contractual obligations, resolve disputes,
              enforce agreements, or comply with applicable legal requirements.
            </p>

            <p>
              School-managed records may be retained according to the
              school&apos;s retention policies and applicable educational or
              legal requirements.
            </p>

            <p>
              When information is no longer required, it may be deleted,
              anonymized, or securely archived in accordance with applicable
              requirements.
            </p>
          </section>

          <section className="pp-section" id="rights">
            <h2>10. Privacy Rights</h2>

            <p>
              Depending on applicable law, users may have rights concerning
              their personal information, which may include:
            </p>

            <ul>
              <li>Requesting access to personal information</li>
              <li>Requesting correction of inaccurate information</li>
              <li>Requesting deletion where legally applicable</li>
              <li>Requesting information about how data is processed</li>
              <li>Objecting to or restricting certain processing</li>
              <li>Withdrawing consent where processing is based on consent</li>
            </ul>

            <p>
              Because PrismaEd+ is frequently used on behalf of schools,
              requests relating to student or school records may need to be
              submitted to the relevant school or authorized administrator.
            </p>
          </section>

          <section className="pp-section" id="cookies">
            <h2>11. Cookies and Similar Technologies</h2>

            <p>
              The PrismaEd+ website and applications may use cookies, local
              storage, session technologies, or similar mechanisms to maintain
              sessions, remember preferences, improve security, and understand
              technical usage.
            </p>

            <p>
              Authentication-related technologies may be necessary for the
              platform to function properly and may not be removable without
              affecting certain functionality.
            </p>
          </section>

          <section className="pp-section" id="third-party">
            <h2>12. Third-Party Services</h2>

            <p>
              PrismaEd+ may integrate with third-party services to provide
              certain functionality. These services may include, depending on
              the school&apos;s configuration:
            </p>

            <ul>
              <li>Cloud hosting and infrastructure providers</li>
              <li>Push notification services</li>
              <li>Email and SMS providers</li>
              <li>Payment processors</li>
              <li>Authentication services</li>
              <li>Analytics and monitoring services</li>
              <li>Mapping or transportation services</li>
            </ul>

            <p>
              Third-party services operate under their own privacy policies and
              terms. Users should review the applicable policies of those
              providers where relevant.
            </p>
          </section>

          <section className="pp-section" id="transfers">
            <h2>13. International Data Transfers</h2>

            <p>
              Depending on the infrastructure and service providers used by
              PrismaEd+, information may be processed or stored in countries
              other than the country where the school or user is located.
            </p>

            <p>
              Where applicable, we take reasonable steps to ensure that such
              transfers are conducted in accordance with applicable data
              protection requirements.
            </p>
          </section>

          <section className="pp-section" id="changes">
            <h2>14. Changes to This Privacy Policy</h2>

            <p>
              We may update this Privacy Policy from time to time to reflect
              changes in our services, technology, legal requirements, or
              privacy practices.
            </p>

            <p>
              When material changes are made, we may provide notice through the
              PrismaEd+ platform, website, application, or other appropriate
              communication channels.
            </p>

            <p>
              The &quot;Last Updated&quot; date at the top of this page
              indicates when this policy was most recently revised.
            </p>
          </section>

          <section className="pp-section" id="contact">
            <h2>15. Contact Us</h2>

            <p>
              If you have questions, concerns, or requests regarding this
              Privacy Policy or the handling of personal information, please
              contact us.
            </p>

            <div className="pp-notice">
              <strong>PrismaEd+</strong>
              <br />
              Company Name: <strong>Prismabit Digital Solution LLp</strong>
              <br />
              Website:
              <a href="https://prismabit.co.in/">
                https://prismabit.co.in/
              </a>
              <br />
              Email:
              <a href="mailto:business@prismabit.co.in">
                business@prismabit.co.in
              </a>
              <br />
              Address: <strong>VIP ROAD, Six mile, Guwahati</strong>
            </div>

            <p>
              For school-managed student, guardian, or employee records, users
              may also contact their school administrator for assistance with
              account access, corrections, or other data-related requests.
            </p>
          </section>
        </article>
      </main>

      <footer className="pp-footer">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white no-underline hover:bg-blue-700 hover:no-underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Login
        </Link>
        <span className="block mt-3">© 2026 PrismaEd+. All rights reserved.</span>
      </footer>
    </div>
  );
}