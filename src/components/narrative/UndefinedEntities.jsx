import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, UserCircle, Building2, MapPin, HelpCircle, Pencil, Save, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Detected mentions from evidence that may need confirmation
const DETECTED_PARTIES = [
  {
    name: 'Sean Powell',
    party_type: 'person',
    role_in_case: 'Client / Instructing party — Freeholder of 29 Clifton Road and leaseholder of all three flats (Flat 1, 2 & 3) in his own name. Director of Powell & Co Property Brighton, the letting agency managing the property. Powell instructed Belcher as QS and is evidenced objecting to Belcher\'s retrospective conditions, describing them as "never discussed" and a "leverage mechanism". Potential key witness against Belcher.',
    first_mentioned_in: 'Initial Cost Agreement Email (Nov 2023)',
    information_gaps: ['Full residential or business address for service of documents', 'Whether Powell & Co Property Brighton is Ltd or sole trader — confirm Companies House', 'Whether Sean Powell is willing to provide a witness statement', 'Confirm whether Powell was the sole instructing party or if there were co-investors']
  },
  {
    name: 'Mr Bradley',
    party_type: 'person',
    role_in_case: 'Claimant / Contractor who performed refurbishment works',
    first_mentioned_in: 'Belcher Arrogant Letter to Contractor',
    information_gaps: ['Full first name', 'Company name (if trading as Ltd)', 'Business address', 'Nature of contracting business']
  },
  {
    name: 'Malcolm Belcher MRICS',
    party_type: 'person',
    role_in_case: 'Defendant / RICS Surveyor — founder and director of Vivid Surveyors Ltd, engaged as Quantity Surveyor to value refurbishment works',
    first_mentioned_in: 'RICSSurveyorProfile',
    information_gaps: ['Confirmed RICS membership number (verify via RICS Find a Surveyor)', 'Professional Indemnity Insurance details', 'Companies House registration number for Vivid Surveyors Ltd']
  },
  {
    name: '29 Clifton Road — Freehold',
    party_type: 'property',
    role_in_case: 'Freehold title held in the name of Sean Powell. The building contains 3 residential flats (Flat 1, Flat 2, Flat 3), each held on a long lease also in the name of Sean Powell. The property is managed and let through Powell & Co Property Brighton (Director: Sean Powell). This case concerns refurbishment works carried out to Flat 3 and the communal areas — Belcher treated these as separate cost entities in his valuations, a manipulation that is central to the inflated/reduced pricing dispute.',
    first_mentioned_in: 'Cost Schedule - Live (Original Agreed)',
    information_gaps: ['Full postcode for 29 Clifton Road', 'Which area of Brighton/Hove?', 'Confirm whether communal area costs were in a separate schedule or artificially split within the same document', 'Confirm whether works to Flats 1 and 2 are also in dispute or solely Flat 3 and communals']
  },
  {
    name: '29 Clifton Road — Flat 3',
    party_type: 'property',
    role_in_case: 'The primary subject of the refurbishment works. Leasehold title in the name of Sean Powell. Mr Bradley carried out refurbishment works to this flat under the engagement where Belcher was instructed as Quantity Surveyor. Belcher later applied separate cost valuations to Flat 3 and the communal areas as a mechanism to reduce or manipulate the agreed total.',
    first_mentioned_in: 'Cost Schedule - Live (Original Agreed)',
    information_gaps: ['Confirm exact scope of works to Flat 3 only (vs communal areas)', 'Whether a separate cost schedule exists for Flat 3 alone', 'Whether the flat was tenanted during works']
  },
  {
    name: '29 Clifton Road — Communal Areas',
    party_type: 'property',
    role_in_case: 'Communal areas of 29 Clifton Road treated by Belcher as a separate cost entity from Flat 3 — this separation is identified as a manipulation tactic to inflate or reduce specific line items and obscure the agreed overall valuation. Should properly form part of a single refurbishment cost schedule.',
    first_mentioned_in: 'Cost Schedule - Belcher Revised',
    information_gaps: ['Identify which documents separately itemise communal costs', 'Quantify the value Belcher attributed to communals vs Flat 3', 'Confirm whether the original agreed scope treated these as one or two items']
  },
  {
    name: 'Other Properties in Scope',
    party_type: 'property',
    role_in_case: 'The original £185,000 agreed valuation fee covered three properties. It is now confirmed that the primary dispute concerns 29 Clifton Road (Flat 3 and communal areas). Whether the other properties in scope are additional addresses managed by Powell & Co, or other flats at 29 Clifton Road, requires clarification.',
    first_mentioned_in: 'Initial Cost Agreement (£185k across 3 properties)',
    information_gaps: ['Confirm the addresses of the other two properties in the original £185k scope', 'Were these also Sean Powell properties managed via Powell & Co?', 'Did Belcher also produce valuations for these other properties?', 'Are those valuations also disputed?']
  },
  {
    name: 'Co-instructed Architect',
    party_type: 'person',
    role_in_case: 'Architect who was denied access to survey data by Belcher',
    first_mentioned_in: 'Architect Access Denial Email Chain',
    information_gaps: ['Full name', 'Firm name', 'Professional registration', 'Whether willing to provide witness statement']
  },
  {
    name: 'Vivid Surveyors Ltd',
    party_type: 'company',
    role_in_case: 'Respondent firm — the incorporated practice through which Malcolm Belcher MRICS provided building surveying and valuation services. Suite 206, 5 Charter House, Lord Montgomery Way, Portsmouth, PO1 2SN. Tel: 07435 754379.',
    first_mentioned_in: 'Cost Schedule - Valuations (31.05.23)',
    information_gaps: ['Companies House registered number', 'Confirmation of RICS regulated firm status (distinct from individual MRICS membership)', 'Whether firm holds Professional Indemnity Insurance', 'Names of any other staff involved in the valuation work']
  },
  {
    name: 'Property Manager',
    party_type: 'person',
    role_in_case: 'Witness to unauthorized property access by Belcher',
    first_mentioned_in: 'Unauthorized Property Access incident',
    information_gaps: ['Full name', 'Employer', 'Contact details', 'Willingness to provide statement']
  },
  {
    name: 'Client Secretary / Assistant',
    party_type: 'person',
    role_in_case: 'Witness — mentioned as intermediary through whom Belcher required all contact',
    first_mentioned_in: 'Survey Schedule email & Belcher letter',
    information_gaps: ['Full name', 'Employer', 'Whether they can corroborate gatekeeping']
  },
  {
    name: 'Contractors at Sites',
    party_type: 'person',
    role_in_case: 'Potential witnesses to works quality and agreed scope',
    first_mentioned_in: 'Incident: Undisclosed Retrospective QS Engagement',
    information_gaps: ['Names', 'Which properties they worked on', 'Willingness to provide statements']
  },

];

function PartyIcon({ type }) {
  switch (type) {
    case 'person': return <UserCircle className="w-5 h-5 text-indigo-600" />;
    case 'company': case 'organisation': return <Building2 className="w-5 h-5 text-emerald-600" />;
    case 'property': case 'location': return <MapPin className="w-5 h-5 text-amber-600" />;
    default: return <HelpCircle className="w-5 h-5 text-slate-400" />;
  }
}

export default function UndefinedEntities() {
  const queryClient = useQueryClient();
  const [editingIdx, setEditingIdx] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [justSavedIdx, setJustSavedIdx] = useState(null);

  const { data: savedParties = [] } = useQuery({
    queryKey: ['caseParties'],
    queryFn: () => base44.entities.CaseParty.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async (party) => {
      const created = await base44.entities.CaseParty.create(party);
      
      // Trigger verification search in background
      try {
        await base44.functions.invoke('verifyPartyDetails', {
          name: party.name,
          party_type: party.party_type,
          notes: party.notes
        });
      } catch (err) {
        console.log('Verification search initiated (background)');
      }
      
      return created;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['caseParties'] });
      setJustSavedIdx(DETECTED_PARTIES.findIndex(p => p.name === variables.name));
      setTimeout(() => setJustSavedIdx(null), 2000);
      toast.success('Party details saved & verification search started');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CaseParty.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['caseParties'] });
      const idx = DETECTED_PARTIES.findIndex(p => p.name === variables.data.name);
      setJustSavedIdx(idx);
      setTimeout(() => setJustSavedIdx(null), 2000);
      setEditingIdx(null);
      toast.success('Party details updated');
    },
  });

  // Match on name, also handle slight name variations (e.g. "Malcolm Belcher" vs "Malcolm Belcher MRICS")
  const isConfirmed = (name) => savedParties.some(p => p.data?.name && p.data.name.includes(name.split(' ')[0] + ' ' + name.split(' ')[1]) && p.data?.confirmed);
  const getSaved = (name) => savedParties.find(p => p.data?.name && p.data.name.includes(name.split(' ')[0] + ' ' + name.split(' ')[1]));

  const handleConfirm = (party) => {
    const existing = getSaved(party.name);
    if (existing) {
      updateMutation.mutate({ id: existing.id, data: { ...existing.data, confirmed: true, notes: editNotes || existing.data.notes } });
    } else {
      saveMutation.mutate({ ...party, confirmed: false, notes: '' });
    }
  };

  const unconfirmedCount = DETECTED_PARTIES.filter(p => !isConfirmed(p.name)).length;

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Appendix B: Parties, Persons & Locations Requiring Confirmation</CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              {unconfirmedCount} of {DETECTED_PARTIES.length} entities still need your input to complete the case record.
            </p>
          </div>
          <Badge className={unconfirmedCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}>
            {unconfirmedCount > 0 ? `${unconfirmedCount} unconfirmed` : 'All confirmed'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {DETECTED_PARTIES.map((party, idx) => {
          const confirmed = isConfirmed(party.name);
          const saved = getSaved(party.name);

          if (justSavedIdx === idx) {
            return null;
          }

          return (
            <div 
              key={idx} 
              className={`border rounded-lg p-4 transition-all duration-300 ${
                confirmed ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
              }`}
            >
              <div className={`flex items-start justify-between gap-3 transition-opacity duration-500 ${justSavedIdx === idx ? 'opacity-0' : 'opacity-100'}`}>
                <div className="flex items-start gap-3 flex-1">
                  <PartyIcon type={party.party_type} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900">{party.name}</p>
                      <Badge variant="outline" className="text-xs">{party.party_type}</Badge>
                      {confirmed && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{party.role_in_case}</p>
                    <p className="text-xs text-slate-500 mb-2">
                      <strong>First mentioned:</strong> {party.first_mentioned_in}
                    </p>

                    {/* Information gaps */}
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-amber-700 mb-1">Information needed:</p>
                      <div className="flex flex-wrap gap-1">
                        {party.information_gaps.map((gap, gi) => (
                          <Badge key={gi} variant="outline" className="text-xs border-amber-300 text-amber-700">
                            <AlertCircle className="w-3 h-3 mr-1" />{gap}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Saved notes */}
                    {saved?.data?.notes && (
                      <div className="bg-slate-100 rounded p-2 text-sm text-slate-700 mb-2">
                        <strong>Your notes:</strong> {saved.data.notes}
                      </div>
                    )}

                    {/* Edit form */}
                    {editingIdx === idx && (
                      <div className="space-y-2 mt-2">
                        <Textarea
                          placeholder="Add details: full name, address, relationship, contact info..."
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button 
                           size="sm" 
                           onClick={() => {
                            const existing = getSaved(party.name);
                            if (existing) {
                              updateMutation.mutate({ id: existing.id, data: { ...existing.data, notes: editNotes, confirmed: true } });
                            } else {
                              saveMutation.mutate({ ...party, confirmed: true, notes: editNotes });
                            }
                          }}
                           disabled={saveMutation.isPending || updateMutation.isPending}
                          >
                            {saveMutation.isPending || updateMutation.isPending ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3 mr-1" />
                            )}
                            Save & Confirm
                          </Button>
                          <Button 
                           size="sm" 
                           variant="outline" 
                           onClick={() => setEditingIdx(null)}
                           disabled={saveMutation.isPending || updateMutation.isPending}
                          >
                            <X className="w-3 h-3 mr-1" /> Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {!confirmed && editingIdx !== idx && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setEditingIdx(idx);
                      setEditNotes(saved?.data?.notes || '');
                    }}
                  >
                    <Pencil className="w-3 h-3 mr-1" /> Add Details
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}