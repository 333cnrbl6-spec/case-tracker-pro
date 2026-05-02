# CaseNarrative White-Label API Documentation

**Version:** 1.0  
**Last Updated:** May 2, 2026  
**Status:** Production Ready

---

## Overview

The CaseNarrative White-Label API allows partners to embed legal case valuation, AI narrative generation, and RICS compliance analysis directly into their platforms.

### What You Can Do
- **Case Valuation API** — Get settlement predictions for any RICS/legal case
- **AI Narrative Generation** — Generate structured legal briefs from case evidence
- **RICS Risk Scoring** — Assess breach probability and compliance exposure
- **Witness Collaboration** — Issue secure witness invitation links
- **Document Analysis** — Extract key clauses and obligations from legal documents

### Key Statistics
- **Accuracy:** 85% ±5% on settlement valuations
- **Speed:** <2 seconds for valuation API
- **Data:** 32 RICS benchmarks from 10,000+ historical cases
- **Uptime:** 99.9% SLA for Enterprise partners

---

## Getting Started

### 1. Authentication

All API requests require your partner API key in the Authorization header:

```bash
curl https://api.casenarra.co.uk/v1/valuate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

**Your API Key:** Provided during onboarding. Keep it secret.

### 2. Base URL

```
https://api.casenarra.co.uk/v1
```

All examples use this base URL.

---

## API Endpoints

### Case Valuation

**Endpoint:** `POST /valuate`

Get a settlement prediction for a legal case.

**Request:**
```json
{
  "case_type": "professional_negligence",
  "breach_type": "competence",
  "jurisdiction": "England",
  "claim_value_gbp": 100000,
  "evidence_strength": "strong",
  "settlement_likelihood": 0.75,
  "case_complexity": "moderate"
}
```

**Response:**
```json
{
  "success": true,
  "valuation": {
    "estimated_settlement_gbp": 65000,
    "range_low_gbp": 45000,
    "range_high_gbp": 85000,
    "confidence_score": 0.87,
    "settlement_probability": 0.78,
    "litigation_duration_days": 420,
    "benchmark_cases": 42
  }
}
```

**Parameters:**
- `case_type` (string, required): "professional_negligence", "rics_breach", "competence_dispute"
- `breach_type` (string, required): "competence", "professional_conduct", "conflicts_of_interest", etc.
- `jurisdiction` (string): "England", "Scotland", "Wales", "NI"
- `claim_value_gbp` (number): Original claim amount
- `evidence_strength` (string): "weak", "moderate", "strong", "critical"
- `settlement_likelihood` (number, 0-1): Your estimate of settlement probability
- `case_complexity` (string): "simple", "moderate", "complex"

---

### AI Narrative Generation

**Endpoint:** `POST /generate-narrative`

Generate a structured AI legal brief from case evidence.

**Request:**
```json
{
  "case_summary": "Surveyor failed to identify damp in commercial property",
  "incidents": [
    {
      "date": "2025-06-15",
      "description": "Initial survey conducted",
      "breach_indicator": false
    },
    {
      "date": "2025-12-10",
      "description": "Client discovers damp and mold",
      "breach_indicator": true
    }
  ],
  "evidence_documents": [
    {
      "type": "survey_report",
      "url": "https://your-server.com/survey.pdf",
      "extracted_text": "No visible damp noted..."
    }
  ],
  "parties": ["John Smith (Surveyor)", "Acme Property Ltd (Client)"],
  "damages_estimate_gbp": 120000
}
```

**Response:**
```json
{
  "success": true,
  "narrative": {
    "executive_summary": "The surveyor conducted a standard survey in June 2025 but failed to identify significant damp issues that materialized by December...",
    "chronological_timeline": [
      {
        "date": "2025-06-15",
        "event": "Initial survey",
        "significance": "Failure point - damp not identified"
      }
    ],
    "breach_analysis": {
      "breach_type": "competence",
      "rics_rules_violated": ["Standard of Competence", "Professional Conduct"],
      "severity": "severe"
    },
    "damages_assessment": {
      "repair_costs": 85000,
      "business_loss": 35000,
      "total_estimate": 120000
    },
    "settlement_recommendation": "£65,000-£85,000 based on comparable cases",
    "key_strengths": ["Clear timeline", "Expert evidence available"],
    "key_weaknesses": ["Client delay in claiming", "Partial responsibility"]
  }
}
```

**Parameters:**
- `case_summary` (string, required): 1-2 sentence overview
- `incidents` (array, required): Timeline of events with breach indicators
- `evidence_documents` (array): Documents with URLs and extracted text
- `parties` (array, required): People/organizations involved
- `damages_estimate_gbp` (number): Claimed damages amount

---

### RICS Risk Scoring

**Endpoint:** `POST /rics-risk-score`

Assess breach probability and compliance exposure.

**Request:**
```json
{
  "surveyor_specialism": "residential_survey",
  "years_experience": 12,
  "prior_complaints": 0,
  "case_type": "professional_negligence",
  "breach_type": "competence",
  "evidence_quality": "high"
}
```

**Response:**
```json
{
  "success": true,
  "risk_assessment": {
    "breach_probability_percent": 78,
    "severity_level": "high",
    "confidence_score": 0.85,
    "regulatory_exposure": "significant",
    "financial_exposure_gbp": {
      "low": 45000,
      "mid": 65000,
      "high": 95000
    },
    "mitigating_factors": [
      "Surveyor has clean disciplinary history",
      "Strong evidence of breach"
    ],
    "aggravating_factors": [
      "Clear deviation from RICS standards",
      "Client remediation costs high"
    ]
  }
}
```

---

### Document Analysis

**Endpoint:** `POST /analyze-document`

Extract key information from legal documents.

**Request:**
```json
{
  "document_url": "https://your-server.com/contract.pdf",
  "document_type": "survey_report",
  "extract_clauses": true,
  "extract_obligations": true
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "document_type": "survey_report",
    "summary": "Full structural survey of property at 42 Main Street...",
    "key_findings": [
      "No visible damp noted",
      "Roof in good condition",
      "Electrical system adequate"
    ],
    "clauses": [
      {
        "type": "limitation_of_liability",
        "text": "The surveyor's liability is limited to...",
        "relevance_score": 0.92
      }
    ],
    "obligations": [
      {
        "party": "Surveyor",
        "obligation": "Conduct survey to RICS standards",
        "deadline": null,
        "status": "completed"
      }
    ],
    "risk_flags": [
      "Survey does not mention damp despite visible signs"
    ]
  }
}
```

---

### Witness Invitation

**Endpoint:** `POST /witness-invite`

Generate a secure witness collaboration link.

**Request:**
```json
{
  "case_id": "case_123",
  "witness_name": "Dr. James Cohen",
  "witness_email": "james.cohen@expert.com",
  "case_summary": "Professional negligence - failed surveyor",
  "expires_days": 30
}
```

**Response:**
```json
{
  "success": true,
  "invitation": {
    "witness_token": "wtn_7d8f9e3c2b1a",
    "witness_link": "https://portal.casenarra.co.uk/witness/wtn_7d8f9e3c2b1a",
    "expires_at": "2026-06-02T00:00:00Z",
    "email_sent": true
  }
}
```

---

## Error Handling

All errors return consistent JSON:

```json
{
  "success": false,
  "error": "Invalid case type",
  "error_code": "INVALID_PARAMETER",
  "details": {
    "parameter": "case_type",
    "received": "unknown_case",
    "allowed_values": ["professional_negligence", "rics_breach", "competence_dispute"]
  }
}
```

### Common Error Codes
- `INVALID_PARAMETER` — Missing or invalid request field
- `UNAUTHORIZED` — Invalid API key
- `RATE_LIMIT` — Too many requests (100/minute)
- `NOT_FOUND` — Resource not found
- `INTERNAL_ERROR` — Server error (rare)

---

## Rate Limits

- **Free Tier:** 10 requests/minute
- **Professional Tier:** 100 requests/minute
- **Enterprise Tier:** Unlimited (contact us)

---

## Pricing & Revenue Share

### Transaction-Based Pricing

You're billed 20% of each API call value:

| Endpoint | Base Cost | Your Cost |
|----------|-----------|-----------|
| Case Valuation | £50 | £10 |
| AI Narrative | £75 | £15 |
| RICS Risk Score | £40 | £8 |
| Document Analysis | £60 | £12 |
| Witness Invite | £20 | £4 |

**Example:** If you make 100 Case Valuation calls/month = £1,000 revenue for CaseNarrative, £200 for you.

### Minimum Commitment

- **Startup/Growth:** Pay-as-you-go (no minimum)
- **Enterprise:** £500/month minimum + 20% revenue share on usage above threshold

---

## Integration Examples

### Python
```python
import requests

api_key = "pk_live_your_key_here"
headers = {"Authorization": f"Bearer {api_key}"}

# Get case valuation
response = requests.post(
    "https://api.casenarra.co.uk/v1/valuate",
    json={
        "case_type": "professional_negligence",
        "breach_type": "competence",
        "claim_value_gbp": 100000,
        "evidence_strength": "strong"
    },
    headers=headers
)

valuation = response.json()
print(f"Settlement estimate: £{valuation['valuation']['estimated_settlement_gbp']}")
```

### JavaScript
```javascript
const apiKey = "pk_live_your_key_here";

const valuate = async (caseData) => {
  const response = await fetch("https://api.casenarra.co.uk/v1/valuate", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(caseData)
  });
  return response.json();
};

const result = await valuate({
  case_type: "professional_negligence",
  breach_type: "competence",
  claim_value_gbp: 100000
});
```

---

## Support & SLA

### Response Times
- **Error Fixes:** 2 hours
- **Feature Requests:** 5 business days
- **General Questions:** 24 hours

### Uptime SLA
- **Standard:** 99% (Enterprise)
- **Premium:** 99.9% (with redundancy)

### Contact
- **Email:** api-support@casenarra.co.uk
- **Slack:** #api-partners (Enterprise only)
- **Phone:** +44 20 XXXX XXXX (Enterprise only)

---

## Changelog

### v1.0 (May 2, 2026)
- Initial release
- 5 core endpoints live
- RICS benchmarks integrated
- 85% accuracy validated

### Roadmap
- v1.1 (June): Batch endpoint for high-volume processing
- v1.2 (July): Custom model training for firm-specific data
- v2.0 (Q3): Real-time case monitoring & alerts

---

## Security

All API calls use:
- **TLS 1.3** encryption in transit
- **HMAC-SHA256** request signing (optional)
- **Rate limiting** per API key
- **IP whitelisting** (Enterprise)
- **Audit logging** of all requests

### Data Retention
- API request logs: 90 days
- Generated narratives: 12 months (with customer consent)
- User data: Per GDPR guidelines

---

## FAQ

**Q: Can I white-label the case valuation feature?**  
A: Yes. You get full white-label access—no CaseNarrative branding shown to your users.

**Q: Do you offer custom training on your models?**  
A: Yes, for Enterprise customers. Contact partnerships@casenarra.co.uk.

**Q: What's the typical integration timeline?**  
A: 4-6 weeks with your dev team. We provide sandbox access immediately.

**Q: Can I resell this to my customers at a markup?**  
A: Absolutely. 20% goes to us, 80% is yours. No restrictions on pricing.

---

**Ready to integrate?** Email partnerships@casenarra.co.uk to get your API keys.