import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, XCircle, ThumbsUp, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function PricingVotingBoard() {
  const [votingRound, setVotingRound] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch active voting round
  const { data: votes = [], isLoading } = useQuery({
    queryKey: ['pricing-votes-active'],
    queryFn: async () => {
      const result = await base44.entities.PricingVote.filter({ round_status: 'active' });
      if (result.length > 0) {
        const round = result[0];
        setVotingRound(round);
        return result;
      }
      return [];
    },
  });

  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me?.().then(u => setCurrentUser(u)).catch(() => setCurrentUser(null));
  }, []);

  // Check if user already voted
  const userHasVoted = votes.some(v => v.voter_email === currentUser?.email);

  const submitVote = async (voteType) => {
    if (!votingRound) {
      toast.error('No active voting round');
      return;
    }

    setSubmitting(true);
    try {
      const userEmail = currentUser?.email;
      
      await base44.entities.PricingVote.create({
        voting_round_id: votingRound.voting_round_id,
        tier_name: votingRound.tier_name,
        voter_email: userEmail,
        vote: voteType,
        comment: comment || '',
        round_status: 'active',
      });

      setUserVote(voteType);
      setComment('');
      toast.success('Vote submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['pricing-votes-active'] });
    } catch (error) {
      toast.error(error?.message || 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading voting data...</div>;
  }

  if (!votingRound || votes.length === 0) {
    return (
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-6 text-center">
          <p className="text-slate-600">No active pricing votes at the moment</p>
        </CardContent>
      </Card>
    );
  }

  const totalVotes = votes.length;
  const approveVotes = votes.filter(v => v.vote === 'approve').length;
  const rejectVotes = votes.filter(v => v.vote === 'reject').length;
  const modifyVotes = votes.filter(v => v.vote === 'modify').length;
  const approvalRate = totalVotes > 0 ? Math.round((approveVotes / totalVotes) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Active Pricing Vote: {votingRound.tier_name}
          </CardTitle>
          <CardDescription>
            Proposed: £{votingRound.proposed_monthly_price}/mo or £{votingRound.proposed_annual_price}/year
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vote Progress */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">{approveVotes}</div>
              <p className="text-sm text-slate-600 mt-1">Approve</p>
            </div>
            <div className="p-4 bg-white rounded-lg text-center">
              <div className="text-3xl font-bold text-yellow-600">{modifyVotes}</div>
              <p className="text-sm text-slate-600 mt-1">Modify</p>
            </div>
            <div className="p-4 bg-white rounded-lg text-center">
              <div className="text-3xl font-bold text-red-600">{rejectVotes}</div>
              <p className="text-sm text-slate-600 mt-1">Reject</p>
            </div>
          </div>

          {/* Approval Rate */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Approval Rate</span>
              <span className="text-sm font-bold">{approvalRate}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  approvalRate >= 50 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(approvalRate, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {totalVotes} of {totalVotes} team members voted
            </p>
          </div>

          {/* User Vote Section */}
          {!userHasVoted ? (
            <div className="space-y-4 p-4 bg-white rounded-lg border-2 border-primary/30">
              <h4 className="font-semibold">Your Vote</h4>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => submitVote('approve')}
                  disabled={submitting}
                  variant={userVote === 'approve' ? 'default' : 'outline'}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </Button>
                <Button
                  onClick={() => submitVote('modify')}
                  disabled={submitting}
                  variant={userVote === 'modify' ? 'default' : 'outline'}
                  className="gap-2"
                >
                  <ThumbsUp className="w-4 h-4" /> Modify
                </Button>
                <Button
                  onClick={() => submitVote('reject')}
                  disabled={submitting}
                  variant={userVote === 'reject' ? 'default' : 'outline'}
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium">Comments (optional)</label>
                <Textarea
                  placeholder="Share your thoughts or suggestions..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mt-2"
                  disabled={submitting}
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-green-900">Your vote has been recorded</p>
            </div>
          )}

          {/* Features List */}
          {votingRound.proposed_features && (
            <div>
              <h4 className="font-semibold text-sm mb-3">Proposed Features</h4>
              <div className="space-y-2">
                {votingRound.proposed_features.map((feature, idx) => (
                  <div key={idx} className="flex gap-2 items-start text-sm">
                    <span className="text-primary font-bold">•</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}