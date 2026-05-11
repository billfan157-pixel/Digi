import { Edit2, Trash2, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PostMenuDropdownProps {
  show: boolean;
  isMyPost: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
}

export const PostMenuDropdown = ({
  show,
  isMyPost,
  onClose,
  onEdit,
  onDelete,
  onReport,
}: PostMenuDropdownProps) => (
  <AnimatePresence>
    {show && (
      <div key="post-menu-overlay">
        <div className="fixed inset-0 z-10" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
