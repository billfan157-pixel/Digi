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
          className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl z-20 overflow-hidden origin-top-right"
        >
          {isMyPost ? (
            <>
              <button
                onClick={onEdit}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors"
              >
                <Edit2 size={16} /> Chỉnh sửa
              </button>
              <button
                onClick={onDelete}
