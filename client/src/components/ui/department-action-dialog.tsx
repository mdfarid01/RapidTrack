import { useState } from "react";
import { Department } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DepartmentActionDialogProps {
  department: Department;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
  isSubmitting: boolean;
}

export function DepartmentActionDialog({
  department,
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting
}: DepartmentActionDialogProps) {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason);
      setReason("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Take Action Against {department} Department
          </DialogTitle>
          <DialogDescription>
            This will send a warning notification to the department management. Please provide a reason for this action.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for action</Label>
              <Textarea
                id="reason"
                placeholder="Explain why you're taking action against this department..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-32"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={reason.trim() === "" || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Action"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}