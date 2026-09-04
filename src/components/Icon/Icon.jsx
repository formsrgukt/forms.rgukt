import React from 'react';
import * as LucideIcons from 'lucide-react';

const iconMap = {
  'undo': LucideIcons.Undo2,
  'redo': LucideIcons.Redo2,
  'preview': LucideIcons.Eye,
  'eye': LucideIcons.Eye,
  'add': LucideIcons.Plus,
  'plus': LucideIcons.Plus,
  'drag': LucideIcons.GripVertical,
  'duplicate': LucideIcons.Copy,
  'copy': LucideIcons.Copy,
  'delete': LucideIcons.Trash2,
  'trash': LucideIcons.Trash2,
  'more': LucideIcons.MoreVertical,
  'settings': LucideIcons.Settings,
  'gear': LucideIcons.Settings,
  'theme': LucideIcons.Palette,
  'palette': LucideIcons.Palette,
  'share': LucideIcons.Share2,
  'link': LucideIcons.Link,
  'qr-code': LucideIcons.QrCode,
  'search': LucideIcons.Search,
  'filter': LucideIcons.Filter,
  'sort': LucideIcons.ArrowUpDown,
  'chevron-down': LucideIcons.ChevronDown,
  'chevron-up': LucideIcons.ChevronUp,
  'check': LucideIcons.Check,
  'close': LucideIcons.X,
  'arrow-right': LucideIcons.ArrowRight,
  'arrow-left': LucideIcons.ArrowLeft,
  'external-link': LucideIcons.ExternalLink,
  'save': LucideIcons.Save,
  'publish': LucideIcons.Send,
  'edit': LucideIcons.Edit2,
  'star': LucideIcons.Star,
  'form': LucideIcons.FileText,
  'responses': LucideIcons.Users,
  'analytics': LucideIcons.BarChart2,
  'templates': LucideIcons.LayoutTemplate,
  'dashboard': LucideIcons.Home,
  'profile': LucideIcons.User,
  'notifications': LucideIcons.Bell,
  'help': LucideIcons.HelpCircle,
  'clock': LucideIcons.Clock,
  'menu': LucideIcons.Menu,
  'download': LucideIcons.Download,
  'users': LucideIcons.Users,
  'activity': LucideIcons.Activity,
  'lock': LucideIcons.Lock,
  'presentation': LucideIcons.LayoutTemplate,
  'eye-off': LucideIcons.EyeOff,
  'mail': LucideIcons.Mail,
  'shuffle': LucideIcons.Shuffle,
  'check-circle': LucideIcons.CheckCircle2,
  'bar-chart': LucideIcons.BarChart3,
  'loader': LucideIcons.Loader2,
  'logout': LucideIcons.LogOut,

  // Question Types
  'short_answer': LucideIcons.Type,
  'paragraph': LucideIcons.List,
  'multiple_choice': LucideIcons.CircleDot,
  'checkboxes': LucideIcons.CheckSquare,
  'dropdown': LucideIcons.ChevronDownSquare,
  'linear_scale': LucideIcons.SlidersHorizontal,
  'rating': LucideIcons.Star,
  'date': LucideIcons.Calendar,
  'time': LucideIcons.Clock,
  'file_upload': LucideIcons.UploadCloud,
  'image': LucideIcons.Image,
  'video': LucideIcons.Video,
  'section': LucideIcons.Rows
};

export default function Icon({ name, size = 20, className = '', ...props }) {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in Icon system.`);
    // Fallback to a generic square if missing, keeping exact SVG constraints
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      </svg>
    );
  }

  return <IconComponent size={size} className={className} {...props} />;
}
