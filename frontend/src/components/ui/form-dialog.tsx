import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave: () => void;
  onCancel?: () => void;
  saveText?: string;
  cancelText?: string;
  loading?: boolean;
  saveDisabled?: boolean;
  showCancelButton?: boolean;
  size?: "sm" | "md" | "lg";
}

export const FormDialog: React.FC<FormDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSave,
  onCancel,
  saveText = "Save",
  cancelText = "Cancel",
  loading = false,
  saveDisabled = false,
  showCancelButton = true,
  size = "md"
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "sm:max-w-[425px]";
      case "lg":
        return "sm:max-w-[800px]";
      default:
        return "sm:max-w-[600px]";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getSizeClass()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        <div className="py-4">
          {children}
        </div>
        
        <DialogFooter>
          {showCancelButton && (
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
          )}
          <Button 
            onClick={onSave} 
            disabled={loading || saveDisabled}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saveText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 