import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, party_type, notes } = await req.json();

    // Build search prompt based on party type
    let searchPrompt = '';
    
    if (party_type === 'person') {
      searchPrompt = `Search for public records for: ${name}
      
If this appears to be a UK professional (surveyor, architect, legal, etc):
- Check professional registers (RICS, RIBA, Law Society, etc)
- Check Companies House director records
- Check any disciplinary records
- Find registered business addresses

Return as JSON:
{
  "verified_name": "full name if found",
  "professional_registrations": ["reg number if found"],
  "company_directorships": ["Company Name Ltd - role"],
  "business_address": "address if found",
  "disciplinary_history": "any known issues or 'clean'",
  "confidence": "high/medium/low"
}`;
    } else if (party_type === 'organisation' || party_type === 'company') {
      searchPrompt = `Search for public records for company: ${name}

Check:
- Companies House registration details
- Company status (active, dissolved, etc)
- Directors and PSC (Persons with Significant Control)
- Registered address
- SIC codes (business type)

Return as JSON:
{
  "registered_name": "exact legal name",
  "company_number": "number if found",
  "status": "active/dissolved/etc",
  "registered_address": "address",
  "directors": ["Name - appointed date"],
  "sic_codes": ["description"],
  "confidence": "high/medium/low"
}`;
    } else if (party_type === 'property' || party_type === 'location') {
      searchPrompt = `Search for property information: ${name}

Check:
- Full address and postcode
- Property type (residential/HMO/commercial)
- Land Registry information if available
- Council tax band
- Recent sales data if public

Return as JSON:
{
  "full_address": "address with postcode",
  "property_type": "type",
  "postcode": "postcode",
  "owner_info": "if publicly available",
  "confidence": "high/medium/low"
}`;
    }

    if (!searchPrompt) {
      return Response.json({ verified_data: null });
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: searchPrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          verified_name: { type: 'string' },
          professional_registrations: { type: 'array', items: { type: 'string' } },
          company_directorships: { type: 'array', items: { type: 'string' } },
          business_address: { type: 'string' },
          disciplinary_history: { type: 'string' },
          registered_name: { type: 'string' },
          company_number: { type: 'string' },
          status: { type: 'string' },
          registered_address: { type: 'string' },
          directors: { type: 'array', items: { type: 'string' } },
          sic_codes: { type: 'array', items: { type: 'string' } },
          full_address: { type: 'string' },
          property_type: { type: 'string' },
          postcode: { type: 'string' },
          owner_info: { type: 'string' },
          confidence: { type: 'string' }
        }
      }
    });

    return Response.json({ verified_data: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});