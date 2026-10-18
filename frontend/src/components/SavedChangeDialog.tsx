import { CheckCircle2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type SavedChangeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
}

export default function SavedChangeDialog({ open, onOpenChange, message }: SavedChangeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-green-700 bg-green-100">
            <CheckCircle2 aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>Changes saved</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Done</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
