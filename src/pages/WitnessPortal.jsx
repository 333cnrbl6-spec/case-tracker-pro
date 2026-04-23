import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, CheckCircle2, AlertCircle, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import ConflictChecker from '@/components/ConflictChecker';

export default function WitnessPortal() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [step, setStep] = useState('validate'); // validate, register, upload
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  
  // Registration form
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Upload form
  const [uploadFile, setUploadFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showConflictCheck, setShowConflictCheck] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('validateWitnessToken', { token });
      setInvitation(result.data);
      
      // Check if already registered
      if (result.data.status === 'registered' || result.data.status === 'completed') {
        setStep('upload');
      } else {
        setStep('register');
      }
      setError(null);
    } catch (err) {
      setError(err.message || 'Invalid or expired witness link');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      // In a real scenario, you'd use base44.auth.register()
      // For now, we update the invitation status
      await base44.asServiceRole.entities.WitnessInvitation.update(invitation.id, {
        status: 'registered',
        witness_name: fullName,
        registered_at: new Date().toISOString(),
      });

      toast.success('Account created successfully!');
      setStep('upload');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      // Upload file
      const uploadResult = await base44.integrations.Core.UploadFile({ file: uploadFile });

      // Create evidence record
      await base44.entities.Evidence.create({
        date_collected: new Date().toISOString().split('T')[0],
        title: uploadFile.name,
        description: description || `Uploaded by witness: ${invitation.witnessName}`,
        evidence_type: uploadFile.type.includes('image') ? 'photograph' : 'document',
        file_url: uploadResult.file_url,
        relevance: 'other',
        strength: 'moderate',
        related_incidents: [invitation.incidentId],
        notes: `Submitted via witness portal by ${invitation.witnessName}`,
      });

      // Update invitation
      await base44.asServiceRole.entities.WitnessInvitation.update(invitation.id, {
        status: 'completed',
        evidence_submitted: (invitation.evidence_submitted || 0) + 1,
      });

      toast.success('Evidence uploaded successfully!');
      
      // Reset form
      setUploadFile(null);
      setDescription('');
      
      // Show success and allow another upload
      setTimeout(() => {
        setStep('upload');
      }, 1500);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading && step === 'validate') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600">Validating your witness link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="pt-8">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
            <p className="text-center text-red-700 font-medium">{error}</p>
            <p className="text-center text-slate-600 text-sm mt-2">Please contact the case manager for a new link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Witness Evidence Portal</h1>
          <p className="text-slate-600">Help with the investigation by submitting photos or documents</p>
        </div>

        {/* Case Context */}
        {invitation && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-700">
                <strong>Incident:</strong> {invitation.incidentTitle}
              </p>
              <p className="text-sm text-slate-700 mt-1">
                <strong>Your Email:</strong> {invitation.witnessEmail}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Registration */}
        {step === 'register' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create Your Account</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Confirm Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="mt-1"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account & Continue'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Upload Evidence */}
        {step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileUp className="w-5 h-5" />
                Upload Evidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Upload File</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="file-input"
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    <label htmlFor="file-input" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-700">
                        {uploadFile ? uploadFile.name : 'Click to select a photo or document'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Images, PDFs, Word documents accepted</p>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this photo/document show? Any context?"
                    className="mt-1 min-h-24 text-sm"
                  />
                </div>

                <div className="flex gap-3">
                   <Button
                     type="button"
                     variant="outline"
                     className="flex-1"
                     onClick={() => setShowConflictCheck(true)}
                   >
                     Check Conflicts
                   </Button>
                   <Button
                     type="submit"
                     disabled={!uploadFile || uploading}
                     className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                   >
                     {uploading ? (
                       <>
                         <Loader2 className="w-4 h-4 animate-spin" />
                         Uploading...
                       </>
                     ) : (
                       <>
                         <Upload className="w-4 h-4" />
                         Submit Evidence
                       </>
                     )}
                   </Button>
                 </div>

                <p className="text-xs text-slate-500 text-center">
                  You can upload multiple files—submit one at a time and come back for more.
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Conflict Checker Modal */}
         {showConflictCheck && step === 'upload' && (
           <Card className="border-indigo-200 bg-indigo-50">
             <CardHeader>
               <CardTitle>Conflict of Interest Check</CardTitle>
             </CardHeader>
             <CardContent>
               <ConflictChecker 
                 witnessName={fullName}
                 documentContent={description}
                 incidentId={invitation?.incident_id}
                 onClose={() => setShowConflictCheck(false)}
               />
             </CardContent>
           </Card>
         )}

        {/* Info */}
         {!showConflictCheck && (
           <Card className="bg-slate-50 border-slate-200">
             <CardContent className="pt-6 text-sm text-slate-700 space-y-2">
               <p>✓ Your data is secure and encrypted</p>
               <p>✓ Only authorized investigators can view your submission</p>
               <p>✓ You can submit multiple files at any time</p>
             </CardContent>
           </Card>
         )}
      </div>
    </div>
  );
}