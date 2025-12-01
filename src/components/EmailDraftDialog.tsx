import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Send, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';

interface EmailDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: string;
  suggestedSubject: string;
  suggestedBody: string;
  recipientType: 'vendor' | 'site' | 'team';
}

export function EmailDraftDialog({
  open,
  onOpenChange,
  context,
  suggestedSubject,
  suggestedBody,
  recipientType
}: EmailDraftDialogProps) {
  const { config } = useApp();
  const { toast } = useToast();
  const [subject, setSubject] = useState(suggestedSubject);
  const [body, setBody] = useState(suggestedBody);
  const [to, setTo] = useState('');
  const [sending, setSending] = useState(false);

  const handleCopy = () => {
    const emailContent = `Subject: ${subject}\n\nTo: ${to}\n\n${body}`;
    navigator.clipboard.writeText(emailContent);
    toast({
      title: 'Email copied',
      description: 'Email content has been copied to your clipboard.',
    });
  };

  const handleSend = async () => {
    if (!config.emailConfig.enabled) {
      toast({
        title: 'Email not configured',
        description: 'Please configure email settings in the Configuration panel first.',
        variant: 'destructive',
      });
      return;
    }

    if (!to.trim()) {
      toast({
        title: 'Recipient required',
        description: 'Please enter a recipient email address.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // Simulate email sending - in real implementation, this would call your email service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Email sent successfully',
        description: `Email sent to ${to}`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Failed to send email',
        description: 'There was an error sending the email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const getRecipientPlaceholder = () => {
    switch (recipientType) {
      case 'vendor':
        return 'vendor@example.com';
      case 'site':
        return 'site.coordinator@hospital.com';
      case 'team':
        return 'team@company.com';
      default:
        return 'recipient@example.com';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Draft Email - {context}
          </DialogTitle>
          <DialogDescription>
            Review and customize the email before sending or copying to your email client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="email"
              placeholder={getRecipientPlaceholder()}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy to Clipboard
          </Button>
          
          {config.emailConfig.enabled ? (
            <Button
              onClick={handleSend}
              disabled={sending || !to.trim()}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {sending ? 'Sending...' : 'Send Email'}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => toast({
                title: 'Email configuration required',
                description: 'Configure email settings in the Configuration panel to send emails directly.',
              })}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Configure Email to Send
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}