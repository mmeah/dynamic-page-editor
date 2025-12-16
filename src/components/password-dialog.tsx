
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface PasswordDialogProps {
  showPasswordPrompt: boolean;
  setShowPasswordPrompt: (show: boolean) => void;
  passwordInput: string;
  setPasswordInput: (password: string) => void;
  handlePasswordSubmit: () => void;
}

export const PasswordDialogComponent: React.FC<PasswordDialogProps> = ({
  showPasswordPrompt,
  setShowPasswordPrompt,
  passwordInput,
  setPasswordInput,
  handlePasswordSubmit,
}) => {
  return (
    <Dialog open={showPasswordPrompt} onOpenChange={setShowPasswordPrompt}>
      <DialogContent>
        <DialogHeader><DialogTitle>Enter Password</DialogTitle></DialogHeader>
        <Input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="Password" onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()} />
        <DialogFooter>
          <Button onClick={handlePasswordSubmit}>Unlock</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
