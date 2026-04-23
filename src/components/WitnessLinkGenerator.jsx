import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Copy, Link2, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WitnessLinkGenerator({ incidentId, incidentTitle }) {
  const [open, setOpen] = useState(false);
  const [witnessEmail, setWitnessEmail] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (!witnessEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const result = await base44.functions.invoke('generateWitnessLink', {
        incidentId,
        witnessEmail,
        witnessName,
      });

      setGeneratedLink(result.data);
      toast.success('Witness link generated!');
    } catch (err) {
      toast.error(err.message || 'Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink.witnessLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setWitnessEmail('');
    setWitnessName('');
    setGeneratedLink(null);
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Link2 className="w-4 h-4" />
          Invite Witness
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Witness Portal Link</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!generatedLink ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Witness Email</label>
                <Input
                  type="email"
                  value={witnessEmail}
                  onChange={(e) => setWitnessEmail(e.target.value)}
                  placeholder="witness@example.com"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Witness Name (optional)</label>
                <Input
                  type="text"
                  value={witnessName}
                  onChange={(e) => setWitnessName(e.target.value)}
                  placeholder="John Smith"
                  className="mt-1"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
                <p>This will generate a secure link that the witness can use to:</p>
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li>Create their own account</li>
                  <li>Upload photos and documents</li>
                  <li>Submit evidence for this incident</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Link...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Generate Link
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-900">Link Created!</p>
                <p className="text-sm text-green-700 mt-1">for {generatedLink.witnessEmail}</p>
              </div>

              <div className="bg-slate-100 rounded p-4 break-all text-xs font-mono select-all">
                {generatedLink.witnessLink}
              </div>

              <Button
                onClick={handleCopyLink}
                className="w-full gap-2 bg-slate-900 hover:bg-slate-800"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>

              <p className="text-xs text-slate-600">
                Share this link with the witness via email or messaging. They can click it to register and upload evidence.
              </p>

              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full"
              >
                Generate Another Link
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}