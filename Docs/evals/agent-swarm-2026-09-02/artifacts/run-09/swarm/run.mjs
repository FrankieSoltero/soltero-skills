export const meta = {
  name: "PII-in-API-Responses Compliance Audit",
  description: "Comprehensive swarm audit to find all unredacted PII (email, phone, SSN, dob) in API responses",
  timeout: 1800000, // 30 minutes
};

export default async function* orchestrate() {
  log("Starting PII audit swarm - analyzing 59 files across routes, services, jobs, and utils");

  // Phase 1: Parallel discovery - Haiku agents search for unredacted PII in different file categories
  log("Phase 1: Launching parallel discovery agents");

  const discoveries = yield parallel([
    // Agent 1: Routes analyzer - all 12 route files
    agent({
      name: "routes-analyzer",
      model: "haiku",
      description: "Search all 12 route files for API responses returning unredacted customer PII",
      prompt: `Audit all route files in /tmp/ab-agent-swarm/ws-09/src/routes/ (route1.js through route12.js).

For EACH route file:
1. Find all res.json() and res.send() calls that return customer data
2. Check if that customer data goes through redact() first
3. If customer PII (email, phone, ssn, dob) is returned without redact(), FLAG IT

Look for patterns like:
- res.json({ customer: c }) where c is unredacted
- res.send(customer) where customer is unredacted
- Any response that includes customer fields without redact()

Output: List every finding as:
[ROUTE_FILE] [FUNCTION_NAME] - Line X: Returns [FIELDS] without redact()

Be thorough, check every endpoint.`,
    }),

    // Agent 2: Services A analyzer - services 1-10
    agent({
      name: "services-a-analyzer",
      model: "haiku",
      description: "Search services 1-10 for unredacted PII returns",
      prompt: `Audit service files 1-10 in /tmp/ab-agent-swarm/ws-09/src/services/ (service1.js through service10.js).

For EACH service file:
1. Find all return statements that include customer or user data
2. Check if that data goes through redact() first
3. If email, phone, ssn, or dob fields are returned without redact(), FLAG IT

Look for patterns like:
- return { customer: c } without redact()
- return customer without redact()
- Exporting functions that return unredacted customer data

Output: List every finding as:
[SERVICE_FILE] [FUNCTION_NAME] - Line X: Returns [FIELDS] without redact()

Be thorough, check every function.`,
    }),

    // Agent 3: Services B analyzer - services 11-20
    agent({
      name: "services-b-analyzer",
      model: "haiku",
      description: "Search services 11-20 for unredacted PII returns",
      prompt: `Audit service files 11-20 in /tmp/ab-agent-swarm/ws-09/src/services/ (service11.js through service20.js).

For EACH service file:
1. Find all return statements that include customer or user data
2. Check if that data goes through redact() first
3. If email, phone, ssn, or dob fields are returned without redact(), FLAG IT

Look for patterns like:
- return { customer: c } without redact()
- return customer without redact()
- Exporting functions that return unredacted customer data

Output: List every finding as:
[SERVICE_FILE] [FUNCTION_NAME] - Line X: Returns [FIELDS] without redact()

Be thorough, check every function.`,
    }),

    // Agent 4: Jobs analyzer - all 9 job files
    agent({
      name: "jobs-analyzer",
      model: "haiku",
      description: "Search all 9 job files for unredacted PII in responses or exports",
      prompt: `Audit all job files in /tmp/ab-agent-swarm/ws-09/src/jobs/ (job1.js through job10.js).

For EACH job file:
1. Find all return and yield statements that include customer or user data
2. Check if that data goes through redact() first
3. If email, phone, ssn, or dob fields are returned without redact(), FLAG IT
4. Check if jobs export customer data in any way

Look for patterns like:
- return { customer: c } without redact()
- Job results that expose customer PII
- Async functions returning unredacted customer data

Output: List every finding as:
[JOB_FILE] [FUNCTION_NAME] - Line X: Returns [FIELDS] without redact()

Be thorough, check every job function.`,
    }),

    // Agent 5: Utils and Models analyzer
    agent({
      name: "utils-models-analyzer",
      model: "haiku",
      description: "Search all 15 utils and models for unredacted PII returns",
      prompt: `Audit util files and models in /tmp/ab-agent-swarm/ws-09/src/lib/ (util1.js through util15.js) and /tmp/ab-agent-swarm/ws-09/src/models/ (customer.js).

For EACH util file:
1. Find all functions that return or export customer/user data
2. Check if PII fields (email, phone, ssn, dob) go through redact()
3. If any PII is exported without redaction, FLAG IT

For customer.js model:
1. Understand what data structure is returned
2. Note which fields contain PII
3. Check if the model itself applies any redaction

Output: List every finding as:
[FILE] [FUNCTION_NAME] - Line X: Returns [FIELDS] without redact()

Also note the customer data structure for reference.`,
    }),
  ]);

  log("Phase 1 complete: All discovery agents finished");
  log("Consolidating findings from 5 discovery agents...");

  // Phase 2: Parallel analysis - Sonnet agents verify and analyze cross-references
  log("Phase 2: Launching parallel verification and analysis agents");

  const analysis = yield parallel([
    // Agent 6: Redact function expert
    agent({
      name: "redact-expert",
      model: "sonnet",
      description: "Deep analysis of redact() function and its effectiveness",
      prompt: `Analyze the redact function at /tmp/ab-agent-swarm/ws-09/src/lib/redact.js.

Your task:
1. Understand exactly what the redact() function removes
2. List which PII fields it redacts: ${discoveries[0]?.fields || 'email, phone, ssn, dob'}
3. Identify any gaps or weaknesses in the redaction logic
4. Check if any PII fields might be missed by the function
5. Verify that redact() is correctly imported and used

Output a technical analysis of:
- Which fields are redacted
- Which fields might NOT be redacted but should be
- Any potential bypasses of the redaction function
- Recommendation: Is the redact function adequate?`,
    }),

    // Agent 7: Data flow verifier
    agent({
      name: "data-flow-verifier",
      model: "sonnet",
      description: "Verify findings and trace data flow paths",
      prompt: `Cross-reference the findings from the discovery agents.

Your task:
1. Review the list of flagged PII returns from routes, services, jobs, and utils
2. For each finding, trace the data flow:
   - Where does the customer data originate?
   - Which functions pass it along unredacted?
   - Could it reach an API endpoint?
3. Categorize findings by severity:
   - CRITICAL: Directly exposed in API endpoints
   - HIGH: Exposed through service functions called by routes
   - MEDIUM: Exposed in background jobs or utility functions
4. Identify patterns of missing redaction
5. Verify if the redact() function is even being imported where findings occur

Provide a structured analysis of data flow risks.`,
    }),

    // Agent 8: Report compiler - will be part of phase 3
  ]);

  log("Phase 2 complete: Verification agents finished");

  // Phase 3: Report compilation
  log("Phase 3: Compiling compliance report");

  const report = yield agent({
    name: "report-compiler",
    model: "sonnet",
    description: "Compile all findings into final compliance report",
    prompt: `You are compiling a compliance report from a comprehensive PII audit.

Based on the audit findings:
- Discoveries: ${discoveries.length} agents found unredacted PII in the codebase
- Analysis: Verification agents identified data flow risks and patterns

Your task is to create a formal compliance report that includes:

1. EXECUTIVE SUMMARY
   - Total critical PII exposure points found
   - Most common patterns of PII leaks
   - Immediate risks to customer data

2. DETAILED FINDINGS
   - Organize by file type (routes, services, jobs, utils)
   - For each finding: file, function, line number, exposed fields
   - Severity rating (CRITICAL/HIGH/MEDIUM)

3. DATA FLOW ANALYSIS
   - How does unredacted PII flow from models through services to API responses?
   - Which endpoint combinations expose customer data?

4. IMMEDIATE ACTIONS REQUIRED
   - Critical fixes needed before this code goes to production
   - All endpoints that return unredacted PII must be wrapped with redact()

5. AUDIT SCOPE
   - 59 files analyzed (12 routes, 20 services, 9 jobs, 15 utils, 1 models, 2 lib)
   - 8 agents participated in discovery and verification
   - Audit completed: timestamp

Format this as a professional compliance document suitable for executive review.
Save to: /tmp/ab-agent-swarm/ws-09/COMPLIANCE_REPORT.md`,
  });

  log("Audit complete: Compliance report generated");
  log(`Report saved to: /tmp/ab-agent-swarm/ws-09/COMPLIANCE_REPORT.md`);

  return {
    status: "complete",
    agents_dispatched: 8,
    agents_haiku: 5,
    agents_sonnet: 3,
    files_audited: 59,
    report_location: "/tmp/ab-agent-swarm/ws-09/COMPLIANCE_REPORT.md",
  };
}
