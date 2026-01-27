import * as HeroIcons from '@heroicons/react/24/outline'
import Icon from '@mdi/react'
import * as MdiPaths from '@mdi/js'

export interface IconOption {
  name: string
  component: React.ComponentType<{ className?: string }>
  category: string
  searchTerms?: string[] // Additional search terms for better matching
}

// Helper to create MDI icon component
const createMdiIcon = (path: string) => {
  const MdiIcon = ({ className }: { className?: string }) => {
    try {
      return <Icon path={path} className={className} style={{ color: 'currentColor' }} />
    } catch (error) {
      console.error('Error rendering MDI icon:', error)
      return null
    }
  }
  MdiIcon.displayName = 'MdiIcon'
  return MdiIcon
}

// Complete list of all 324 Heroicons organized by category
export const AVAILABLE_ICONS: IconOption[] = [
  // Common (popular, frequently used icons)
  { name: 'Home', component: HeroIcons.HomeIcon, category: 'Common', searchTerms: ['house', 'main', 'dashboard', 'start'] },
  { name: 'Star', component: HeroIcons.StarIcon, category: 'Common', searchTerms: ['favorite', 'rating', 'bookmark', 'important'] },
  { name: 'Heart', component: HeroIcons.HeartIcon, category: 'Common', searchTerms: ['love', 'like', 'favorite', 'health'] },
  { name: 'Bookmark', component: HeroIcons.BookmarkIcon, category: 'Common', searchTerms: ['save', 'favorite', 'mark', 'flag'] },
  { name: 'BookmarkSlash', component: HeroIcons.BookmarkSlashIcon, category: 'Common', searchTerms: ['unsave', 'remove', 'unfavorite'] },
  { name: 'BookmarkSquare', component: HeroIcons.BookmarkSquareIcon, category: 'Common', searchTerms: ['save', 'favorite', 'mark'] },
  { name: 'Fire', component: HeroIcons.FireIcon, category: 'Common', searchTerms: ['hot', 'trending', 'flame', 'popular', 'burn'] },
  { name: 'Sparkles', component: HeroIcons.SparklesIcon, category: 'Common', searchTerms: ['new', 'magic', 'ai', 'special', 'shine', 'stars'] },
  { name: 'Bell', component: HeroIcons.BellIcon, category: 'Common', searchTerms: ['notification', 'alert', 'alarm', 'ring'] },
  { name: 'BellAlert', component: HeroIcons.BellAlertIcon, category: 'Common', searchTerms: ['notification', 'alert', 'alarm', 'urgent'] },
  { name: 'BellSlash', component: HeroIcons.BellSlashIcon, category: 'Common', searchTerms: ['mute', 'silent', 'no notification', 'quiet'] },
  { name: 'BellSnooze', component: HeroIcons.BellSnoozeIcon, category: 'Common', searchTerms: ['snooze', 'delay', 'later', 'remind'] },
  { name: 'MagnifyingGlass', component: HeroIcons.MagnifyingGlassIcon, category: 'Common', searchTerms: ['search', 'find', 'lookup', 'zoom'] },
  { name: 'Flag', component: HeroIcons.FlagIcon, category: 'Common', searchTerms: ['report', 'mark', 'country', 'important'] },
  { name: 'Trash', component: HeroIcons.TrashIcon, category: 'Common', searchTerms: ['delete', 'remove', 'garbage', 'bin', 'discard'] },
  { name: 'Check', component: HeroIcons.CheckIcon, category: 'Common', searchTerms: ['done', 'complete', 'yes', 'ok', 'success', 'tick'] },
  { name: 'CheckCircle', component: HeroIcons.CheckCircleIcon, category: 'Common', searchTerms: ['done', 'complete', 'yes', 'ok', 'success', 'verified'] },
  { name: 'CheckBadge', component: HeroIcons.CheckBadgeIcon, category: 'Common', searchTerms: ['verified', 'approved', 'certified', 'authentic'] },
  { name: 'XMark', component: HeroIcons.XMarkIcon, category: 'Common', searchTerms: ['close', 'cancel', 'no', 'remove', 'delete', 'x'] },
  { name: 'XCircle', component: HeroIcons.XCircleIcon, category: 'Common', searchTerms: ['close', 'cancel', 'error', 'remove', 'delete'] },

  // Navigation (arrows, directions, movement)
  { name: 'ArrowUp', component: HeroIcons.ArrowUpIcon, category: 'Navigation', searchTerms: ['up', 'direction', 'move', 'north'] },
  { name: 'ArrowDown', component: HeroIcons.ArrowDownIcon, category: 'Navigation', searchTerms: ['down', 'direction', 'move', 'south'] },
  { name: 'ArrowLeft', component: HeroIcons.ArrowLeftIcon, category: 'Navigation', searchTerms: ['left', 'back', 'previous', 'west'] },
  { name: 'ArrowRight', component: HeroIcons.ArrowRightIcon, category: 'Navigation', searchTerms: ['right', 'next', 'forward', 'east'] },
  { name: 'ArrowUpCircle', component: HeroIcons.ArrowUpCircleIcon, category: 'Navigation', searchTerms: ['up', 'direction', 'circle'] },
  { name: 'ArrowDownCircle', component: HeroIcons.ArrowDownCircleIcon, category: 'Navigation', searchTerms: ['down', 'direction', 'circle'] },
  { name: 'ArrowLeftCircle', component: HeroIcons.ArrowLeftCircleIcon, category: 'Navigation', searchTerms: ['left', 'back', 'circle'] },
  { name: 'ArrowRightCircle', component: HeroIcons.ArrowRightCircleIcon, category: 'Navigation', searchTerms: ['right', 'next', 'circle'] },
  { name: 'ArrowUpLeft', component: HeroIcons.ArrowUpLeftIcon, category: 'Navigation', searchTerms: ['diagonal', 'northwest'] },
  { name: 'ArrowUpRight', component: HeroIcons.ArrowUpRightIcon, category: 'Navigation', searchTerms: ['diagonal', 'northeast', 'external', 'link'] },
  { name: 'ArrowDownLeft', component: HeroIcons.ArrowDownLeftIcon, category: 'Navigation', searchTerms: ['diagonal', 'southwest'] },
  { name: 'ArrowDownRight', component: HeroIcons.ArrowDownRightIcon, category: 'Navigation', searchTerms: ['diagonal', 'southeast'] },
  { name: 'ArrowLongUp', component: HeroIcons.ArrowLongUpIcon, category: 'Navigation', searchTerms: ['up', 'long', 'scroll'] },
  { name: 'ArrowLongDown', component: HeroIcons.ArrowLongDownIcon, category: 'Navigation', searchTerms: ['down', 'long', 'scroll'] },
  { name: 'ArrowLongLeft', component: HeroIcons.ArrowLongLeftIcon, category: 'Navigation', searchTerms: ['left', 'long', 'back'] },
  { name: 'ArrowLongRight', component: HeroIcons.ArrowLongRightIcon, category: 'Navigation', searchTerms: ['right', 'long', 'next'] },
  { name: 'ArrowSmallUp', component: HeroIcons.ArrowSmallUpIcon, category: 'Navigation', searchTerms: ['up', 'small', 'mini'] },
  { name: 'ArrowSmallDown', component: HeroIcons.ArrowSmallDownIcon, category: 'Navigation', searchTerms: ['down', 'small', 'mini'] },
  { name: 'ArrowSmallLeft', component: HeroIcons.ArrowSmallLeftIcon, category: 'Navigation', searchTerms: ['left', 'small', 'mini'] },
  { name: 'ArrowSmallRight', component: HeroIcons.ArrowSmallRightIcon, category: 'Navigation', searchTerms: ['right', 'small', 'mini'] },
  { name: 'ArrowUturnUp', component: HeroIcons.ArrowUturnUpIcon, category: 'Navigation', searchTerms: ['return', 'undo', 'back'] },
  { name: 'ArrowUturnDown', component: HeroIcons.ArrowUturnDownIcon, category: 'Navigation', searchTerms: ['return', 'redo', 'forward'] },
  { name: 'ArrowUturnLeft', component: HeroIcons.ArrowUturnLeftIcon, category: 'Navigation', searchTerms: ['return', 'undo', 'back', 'u-turn'] },
  { name: 'ArrowUturnRight', component: HeroIcons.ArrowUturnRightIcon, category: 'Navigation', searchTerms: ['return', 'redo', 'forward', 'u-turn'] },
  { name: 'ArrowPath', component: HeroIcons.ArrowPathIcon, category: 'Navigation', searchTerms: ['refresh', 'reload', 'sync', 'rotate', 'update'] },
  { name: 'ArrowPathRoundedSquare', component: HeroIcons.ArrowPathRoundedSquareIcon, category: 'Navigation', searchTerms: ['refresh', 'reload', 'sync', 'rotate'] },
  { name: 'ArrowTopRightOnSquare', component: HeroIcons.ArrowTopRightOnSquareIcon, category: 'Navigation', searchTerms: ['external', 'link', 'open', 'new tab', 'launch'] },
  { name: 'ArrowsPointingIn', component: HeroIcons.ArrowsPointingInIcon, category: 'Navigation', searchTerms: ['collapse', 'minimize', 'compress', 'shrink'] },
  { name: 'ArrowsPointingOut', component: HeroIcons.ArrowsPointingOutIcon, category: 'Navigation', searchTerms: ['expand', 'maximize', 'fullscreen', 'enlarge'] },
  { name: 'ArrowsRightLeft', component: HeroIcons.ArrowsRightLeftIcon, category: 'Navigation', searchTerms: ['swap', 'switch', 'exchange', 'transfer'] },
  { name: 'ArrowsUpDown', component: HeroIcons.ArrowsUpDownIcon, category: 'Navigation', searchTerms: ['sort', 'swap', 'switch', 'reorder'] },
  { name: 'ArrowTrendingUp', component: HeroIcons.ArrowTrendingUpIcon, category: 'Navigation', searchTerms: ['growth', 'increase', 'analytics', 'trending', 'profit', 'stocks'] },
  { name: 'ArrowTrendingDown', component: HeroIcons.ArrowTrendingDownIcon, category: 'Navigation', searchTerms: ['decline', 'decrease', 'analytics', 'loss', 'stocks'] },
  { name: 'ArrowTurnDownLeft', component: HeroIcons.ArrowTurnDownLeftIcon, category: 'Navigation', searchTerms: ['turn', 'corner'] },
  { name: 'ArrowTurnDownRight', component: HeroIcons.ArrowTurnDownRightIcon, category: 'Navigation', searchTerms: ['turn', 'corner', 'enter'] },
  { name: 'ArrowTurnLeftDown', component: HeroIcons.ArrowTurnLeftDownIcon, category: 'Navigation', searchTerms: ['turn', 'corner'] },
  { name: 'ArrowTurnLeftUp', component: HeroIcons.ArrowTurnLeftUpIcon, category: 'Navigation', searchTerms: ['turn', 'corner'] },
  { name: 'ArrowTurnRightDown', component: HeroIcons.ArrowTurnRightDownIcon, category: 'Navigation', searchTerms: ['turn', 'corner'] },
  { name: 'ArrowTurnRightUp', component: HeroIcons.ArrowTurnRightUpIcon, category: 'Navigation', searchTerms: ['turn', 'corner'] },
  { name: 'ArrowTurnUpLeft', component: HeroIcons.ArrowTurnUpLeftIcon, category: 'Navigation', searchTerms: ['turn', 'corner'] },
  { name: 'ArrowTurnUpRight', component: HeroIcons.ArrowTurnUpRightIcon, category: 'Navigation', searchTerms: ['turn', 'corner'] },
  { name: 'ChevronUp', component: HeroIcons.ChevronUpIcon, category: 'Navigation', searchTerms: ['up', 'expand', 'collapse', 'caret'] },
  { name: 'ChevronDown', component: HeroIcons.ChevronDownIcon, category: 'Navigation', searchTerms: ['down', 'expand', 'collapse', 'dropdown', 'caret'] },
  { name: 'ChevronLeft', component: HeroIcons.ChevronLeftIcon, category: 'Navigation', searchTerms: ['left', 'back', 'previous', 'caret'] },
  { name: 'ChevronRight', component: HeroIcons.ChevronRightIcon, category: 'Navigation', searchTerms: ['right', 'next', 'forward', 'caret'] },
  { name: 'ChevronDoubleUp', component: HeroIcons.ChevronDoubleUpIcon, category: 'Navigation', searchTerms: ['up', 'first', 'top', 'scroll'] },
  { name: 'ChevronDoubleDown', component: HeroIcons.ChevronDoubleDownIcon, category: 'Navigation', searchTerms: ['down', 'last', 'bottom', 'scroll'] },
  { name: 'ChevronDoubleLeft', component: HeroIcons.ChevronDoubleLeftIcon, category: 'Navigation', searchTerms: ['left', 'first', 'start', 'rewind'] },
  { name: 'ChevronDoubleRight', component: HeroIcons.ChevronDoubleRightIcon, category: 'Navigation', searchTerms: ['right', 'last', 'end', 'fast forward'] },
  { name: 'ChevronUpDown', component: HeroIcons.ChevronUpDownIcon, category: 'Navigation', searchTerms: ['sort', 'select', 'dropdown', 'expand'] },
  { name: 'Backward', component: HeroIcons.BackwardIcon, category: 'Navigation', searchTerms: ['rewind', 'previous', 'back', 'media'] },
  { name: 'Forward', component: HeroIcons.ForwardIcon, category: 'Navigation', searchTerms: ['fast forward', 'next', 'skip', 'media'] },

  // Actions (play, pause, stop, etc.)
  { name: 'Play', component: HeroIcons.PlayIcon, category: 'Actions', searchTerms: ['start', 'run', 'begin', 'media', 'video'] },
  { name: 'PlayCircle', component: HeroIcons.PlayCircleIcon, category: 'Actions', searchTerms: ['start', 'run', 'begin', 'media', 'video'] },
  { name: 'PlayPause', component: HeroIcons.PlayPauseIcon, category: 'Actions', searchTerms: ['toggle', 'media', 'control'] },
  { name: 'Pause', component: HeroIcons.PauseIcon, category: 'Actions', searchTerms: ['wait', 'hold', 'media', 'suspend'] },
  { name: 'PauseCircle', component: HeroIcons.PauseCircleIcon, category: 'Actions', searchTerms: ['wait', 'hold', 'media', 'suspend'] },
  { name: 'Stop', component: HeroIcons.StopIcon, category: 'Actions', searchTerms: ['end', 'halt', 'media', 'terminate'] },
  { name: 'StopCircle', component: HeroIcons.StopCircleIcon, category: 'Actions', searchTerms: ['end', 'halt', 'media', 'terminate'] },
  { name: 'Plus', component: HeroIcons.PlusIcon, category: 'Actions', searchTerms: ['add', 'new', 'create', 'increase', '+'] },
  { name: 'PlusCircle', component: HeroIcons.PlusCircleIcon, category: 'Actions', searchTerms: ['add', 'new', 'create', 'increase'] },
  { name: 'PlusSmall', component: HeroIcons.PlusSmallIcon, category: 'Actions', searchTerms: ['add', 'new', 'create', 'small'] },
  { name: 'Minus', component: HeroIcons.MinusIcon, category: 'Actions', searchTerms: ['remove', 'subtract', 'decrease', '-'] },
  { name: 'MinusCircle', component: HeroIcons.MinusCircleIcon, category: 'Actions', searchTerms: ['remove', 'subtract', 'decrease'] },
  { name: 'MinusSmall', component: HeroIcons.MinusSmallIcon, category: 'Actions', searchTerms: ['remove', 'subtract', 'small'] },
  { name: 'Pencil', component: HeroIcons.PencilIcon, category: 'Actions', searchTerms: ['edit', 'write', 'modify', 'change', 'update'] },
  { name: 'PencilSquare', component: HeroIcons.PencilSquareIcon, category: 'Actions', searchTerms: ['edit', 'write', 'modify', 'compose', 'update'] },
  { name: 'Share', component: HeroIcons.ShareIcon, category: 'Actions', searchTerms: ['send', 'social', 'export', 'distribute'] },
  { name: 'ArrowDownTray', component: HeroIcons.ArrowDownTrayIcon, category: 'Actions', searchTerms: ['download', 'save', 'get', 'fetch'] },
  { name: 'ArrowUpTray', component: HeroIcons.ArrowUpTrayIcon, category: 'Actions', searchTerms: ['upload', 'send', 'export', 'submit'] },
  { name: 'ArrowDownOnSquare', component: HeroIcons.ArrowDownOnSquareIcon, category: 'Actions', searchTerms: ['download', 'install', 'save'] },
  { name: 'ArrowUpOnSquare', component: HeroIcons.ArrowUpOnSquareIcon, category: 'Actions', searchTerms: ['share', 'upload', 'export'] },
  { name: 'ArrowDownOnSquareStack', component: HeroIcons.ArrowDownOnSquareStackIcon, category: 'Actions', searchTerms: ['download all', 'batch', 'install'] },
  { name: 'ArrowUpOnSquareStack', component: HeroIcons.ArrowUpOnSquareStackIcon, category: 'Actions', searchTerms: ['upload all', 'batch', 'share'] },
  { name: 'CloudArrowUp', component: HeroIcons.CloudArrowUpIcon, category: 'Actions', searchTerms: ['upload', 'cloud', 'backup', 'sync'] },
  { name: 'CloudArrowDown', component: HeroIcons.CloudArrowDownIcon, category: 'Actions', searchTerms: ['download', 'cloud', 'restore', 'sync'] },
  { name: 'PaperAirplane', component: HeroIcons.PaperAirplaneIcon, category: 'Actions', searchTerms: ['send', 'submit', 'message', 'email', 'fly'] },
  { name: 'PaperClip', component: HeroIcons.PaperClipIcon, category: 'Actions', searchTerms: ['attach', 'attachment', 'file', 'clip'] },
  { name: 'Printer', component: HeroIcons.PrinterIcon, category: 'Actions', searchTerms: ['print', 'document', 'output', 'paper'] },
  { name: 'Scissors', component: HeroIcons.ScissorsIcon, category: 'Actions', searchTerms: ['cut', 'clip', 'trim', 'snip'] },
  { name: 'Power', component: HeroIcons.PowerIcon, category: 'Actions', searchTerms: ['on', 'off', 'shutdown', 'logout', 'exit'] },
  { name: 'Backspace', component: HeroIcons.BackspaceIcon, category: 'Actions', searchTerms: ['delete', 'remove', 'erase', 'clear'] },

  // Development (code, terminal, bug, etc.)
  { name: 'CodeBracket', component: HeroIcons.CodeBracketIcon, category: 'Development', searchTerms: ['code', 'programming', 'developer', 'html', 'script'] },
  { name: 'CodeBracketSquare', component: HeroIcons.CodeBracketSquareIcon, category: 'Development', searchTerms: ['code', 'programming', 'developer', 'embed'] },
  { name: 'CommandLine', component: HeroIcons.CommandLineIcon, category: 'Development', searchTerms: ['terminal', 'console', 'cli', 'shell', 'bash', 'prompt'] },
  { name: 'BugAnt', component: HeroIcons.BugAntIcon, category: 'Development', searchTerms: ['bug', 'debug', 'error', 'issue', 'problem'] },
  { name: 'Server', component: HeroIcons.ServerIcon, category: 'Development', searchTerms: ['hosting', 'backend', 'computer', 'machine', 'rack'] },
  { name: 'ServerStack', component: HeroIcons.ServerStackIcon, category: 'Development', searchTerms: ['hosting', 'infrastructure', 'rack', 'datacenter'] },
  { name: 'CircleStack', component: HeroIcons.CircleStackIcon, category: 'Development', searchTerms: ['database', 'db', 'storage', 'data', 'sql'] },
  { name: 'Cube', component: HeroIcons.CubeIcon, category: 'Development', searchTerms: ['3d', 'box', 'package', 'module', 'container'] },
  { name: 'CubeTransparent', component: HeroIcons.CubeTransparentIcon, category: 'Development', searchTerms: ['3d', 'box', 'wireframe', 'model'] },
  { name: 'Cloud', component: HeroIcons.CloudIcon, category: 'Development', searchTerms: ['hosting', 'storage', 'online', 'saas', 'aws', 'azure'] },
  { name: 'Cog', component: HeroIcons.CogIcon, category: 'Development', searchTerms: ['settings', 'gear', 'config', 'options', 'preferences'] },
  { name: 'Cog6Tooth', component: HeroIcons.Cog6ToothIcon, category: 'Development', searchTerms: ['settings', 'gear', 'config', 'options', 'preferences'] },
  { name: 'Cog8Tooth', component: HeroIcons.Cog8ToothIcon, category: 'Development', searchTerms: ['settings', 'gear', 'config', 'options', 'preferences'] },
  { name: 'CpuChip', component: HeroIcons.CpuChipIcon, category: 'Development', searchTerms: ['processor', 'chip', 'hardware', 'computer', 'cpu'] },
  { name: 'ComputerDesktop', component: HeroIcons.ComputerDesktopIcon, category: 'Development', searchTerms: ['pc', 'computer', 'monitor', 'desktop', 'screen'] },
  { name: 'Window', component: HeroIcons.WindowIcon, category: 'Development', searchTerms: ['browser', 'app', 'application', 'frame'] },
  { name: 'Variable', component: HeroIcons.VariableIcon, category: 'Development', searchTerms: ['math', 'code', 'formula', 'function'] },
  { name: 'QrCode', component: HeroIcons.QrCodeIcon, category: 'Development', searchTerms: ['barcode', 'scan', 'code', 'link'] },
  { name: 'Wrench', component: HeroIcons.WrenchIcon, category: 'Development', searchTerms: ['tool', 'fix', 'repair', 'settings', 'maintenance'] },
  { name: 'WrenchScrewdriver', component: HeroIcons.WrenchScrewdriverIcon, category: 'Development', searchTerms: ['tools', 'fix', 'repair', 'settings', 'maintenance'] },

  // Social (chat, users, communication)
  { name: 'ChatBubbleBottomCenter', component: HeroIcons.ChatBubbleBottomCenterIcon, category: 'Social', searchTerms: ['message', 'chat', 'comment', 'talk', 'conversation'] },
  { name: 'ChatBubbleBottomCenterText', component: HeroIcons.ChatBubbleBottomCenterTextIcon, category: 'Social', searchTerms: ['message', 'chat', 'comment', 'text', 'sms'] },
  { name: 'ChatBubbleLeft', component: HeroIcons.ChatBubbleLeftIcon, category: 'Social', searchTerms: ['message', 'chat', 'comment', 'talk'] },
  { name: 'ChatBubbleLeftEllipsis', component: HeroIcons.ChatBubbleLeftEllipsisIcon, category: 'Social', searchTerms: ['typing', 'message', 'chat', 'loading'] },
  { name: 'ChatBubbleLeftRight', component: HeroIcons.ChatBubbleLeftRightIcon, category: 'Social', searchTerms: ['conversation', 'chat', 'discuss', 'talk'] },
  { name: 'ChatBubbleOvalLeft', component: HeroIcons.ChatBubbleOvalLeftIcon, category: 'Social', searchTerms: ['message', 'chat', 'comment'] },
  { name: 'ChatBubbleOvalLeftEllipsis', component: HeroIcons.ChatBubbleOvalLeftEllipsisIcon, category: 'Social', searchTerms: ['typing', 'loading', 'chat'] },
  { name: 'Envelope', component: HeroIcons.EnvelopeIcon, category: 'Social', searchTerms: ['email', 'mail', 'message', 'letter', 'inbox'] },
  { name: 'EnvelopeOpen', component: HeroIcons.EnvelopeOpenIcon, category: 'Social', searchTerms: ['email', 'mail', 'read', 'opened'] },
  { name: 'Phone', component: HeroIcons.PhoneIcon, category: 'Social', searchTerms: ['call', 'telephone', 'contact', 'mobile', 'cell'] },
  { name: 'PhoneArrowDownLeft', component: HeroIcons.PhoneArrowDownLeftIcon, category: 'Social', searchTerms: ['incoming call', 'receive'] },
  { name: 'PhoneArrowUpRight', component: HeroIcons.PhoneArrowUpRightIcon, category: 'Social', searchTerms: ['outgoing call', 'dial'] },
  { name: 'PhoneXMark', component: HeroIcons.PhoneXMarkIcon, category: 'Social', searchTerms: ['hang up', 'end call', 'decline'] },
  { name: 'User', component: HeroIcons.UserIcon, category: 'Social', searchTerms: ['person', 'profile', 'account', 'member'] },
  { name: 'UserCircle', component: HeroIcons.UserCircleIcon, category: 'Social', searchTerms: ['person', 'profile', 'avatar', 'account'] },
  { name: 'UserGroup', component: HeroIcons.UserGroupIcon, category: 'Social', searchTerms: ['people', 'team', 'group', 'members', 'community'] },
  { name: 'UserMinus', component: HeroIcons.UserMinusIcon, category: 'Social', searchTerms: ['remove user', 'unfriend', 'delete'] },
  { name: 'UserPlus', component: HeroIcons.UserPlusIcon, category: 'Social', searchTerms: ['add user', 'invite', 'friend', 'new member'] },
  { name: 'Users', component: HeroIcons.UsersIcon, category: 'Social', searchTerms: ['people', 'team', 'group', 'members'] },
  { name: 'AtSymbol', component: HeroIcons.AtSymbolIcon, category: 'Social', searchTerms: ['email', 'mention', '@', 'at'] },
  { name: 'Hashtag', component: HeroIcons.HashtagIcon, category: 'Social', searchTerms: ['tag', 'topic', 'trend', '#', 'number'] },
  { name: 'HandRaised', component: HeroIcons.HandRaisedIcon, category: 'Social', searchTerms: ['stop', 'wave', 'hi', 'hello', 'volunteer'] },
  { name: 'HandThumbUp', component: HeroIcons.HandThumbUpIcon, category: 'Social', searchTerms: ['like', 'approve', 'good', 'yes', 'thumbsup'] },
  { name: 'HandThumbDown', component: HeroIcons.HandThumbDownIcon, category: 'Social', searchTerms: ['dislike', 'disapprove', 'bad', 'no', 'thumbsdown'] },
  { name: 'Megaphone', component: HeroIcons.MegaphoneIcon, category: 'Social', searchTerms: ['announcement', 'broadcast', 'marketing', 'promotion'] },
  { name: 'Rss', component: HeroIcons.RssIcon, category: 'Social', searchTerms: ['feed', 'blog', 'news', 'subscribe'] },

  // Media (photo, video, music, etc.)
  { name: 'Photo', component: HeroIcons.PhotoIcon, category: 'Media', searchTerms: ['image', 'picture', 'gallery', 'photograph'] },
  { name: 'VideoCamera', component: HeroIcons.VideoCameraIcon, category: 'Media', searchTerms: ['video', 'movie', 'record', 'camera', 'film'] },
  { name: 'VideoCameraSlash', component: HeroIcons.VideoCameraSlashIcon, category: 'Media', searchTerms: ['video off', 'camera off', 'no video'] },
  { name: 'Camera', component: HeroIcons.CameraIcon, category: 'Media', searchTerms: ['photo', 'picture', 'snapshot', 'capture'] },
  { name: 'Film', component: HeroIcons.FilmIcon, category: 'Media', searchTerms: ['movie', 'video', 'cinema', 'reel', 'media'] },
  { name: 'Tv', component: HeroIcons.TvIcon, category: 'Media', searchTerms: ['television', 'monitor', 'screen', 'display', 'watch', 'streaming'] },
  { name: 'MusicalNote', component: HeroIcons.MusicalNoteIcon, category: 'Media', searchTerms: ['music', 'song', 'audio', 'sound', 'tune'] },
  { name: 'Microphone', component: HeroIcons.MicrophoneIcon, category: 'Media', searchTerms: ['mic', 'voice', 'record', 'audio', 'podcast', 'speak'] },
  { name: 'SpeakerWave', component: HeroIcons.SpeakerWaveIcon, category: 'Media', searchTerms: ['sound', 'audio', 'volume', 'loud', 'music'] },
  { name: 'SpeakerXMark', component: HeroIcons.SpeakerXMarkIcon, category: 'Media', searchTerms: ['mute', 'silent', 'no sound', 'quiet'] },
  { name: 'Radio', component: HeroIcons.RadioIcon, category: 'Media', searchTerms: ['broadcast', 'podcast', 'audio', 'fm', 'am'] },
  { name: 'Signal', component: HeroIcons.SignalIcon, category: 'Media', searchTerms: ['wifi', 'connection', 'network', 'bars', 'cellular'] },
  { name: 'SignalSlash', component: HeroIcons.SignalSlashIcon, category: 'Media', searchTerms: ['no signal', 'offline', 'disconnected'] },
  { name: 'Gif', component: HeroIcons.GifIcon, category: 'Media', searchTerms: ['animation', 'image', 'meme'] },
  { name: 'EyeDropper', component: HeroIcons.EyeDropperIcon, category: 'Media', searchTerms: ['color', 'picker', 'sample', 'design'] },
  { name: 'PaintBrush', component: HeroIcons.PaintBrushIcon, category: 'Media', searchTerms: ['art', 'design', 'draw', 'paint', 'creative'] },
  { name: 'Swatch', component: HeroIcons.SwatchIcon, category: 'Media', searchTerms: ['color', 'palette', 'design', 'theme'] },

  // Files (document, folder, archive, etc.)
  { name: 'Document', component: HeroIcons.DocumentIcon, category: 'Files', searchTerms: ['file', 'page', 'paper', 'doc'] },
  { name: 'DocumentText', component: HeroIcons.DocumentTextIcon, category: 'Files', searchTerms: ['file', 'text', 'page', 'doc', 'readme'] },
  { name: 'DocumentArrowDown', component: HeroIcons.DocumentArrowDownIcon, category: 'Files', searchTerms: ['download', 'file', 'export'] },
  { name: 'DocumentArrowUp', component: HeroIcons.DocumentArrowUpIcon, category: 'Files', searchTerms: ['upload', 'file', 'import'] },
  { name: 'DocumentChartBar', component: HeroIcons.DocumentChartBarIcon, category: 'Files', searchTerms: ['report', 'analytics', 'stats', 'excel'] },
  { name: 'DocumentCheck', component: HeroIcons.DocumentCheckIcon, category: 'Files', searchTerms: ['approved', 'verified', 'complete'] },
  { name: 'DocumentDuplicate', component: HeroIcons.DocumentDuplicateIcon, category: 'Files', searchTerms: ['copy', 'duplicate', 'clone'] },
  { name: 'DocumentMagnifyingGlass', component: HeroIcons.DocumentMagnifyingGlassIcon, category: 'Files', searchTerms: ['search', 'find', 'preview'] },
  { name: 'DocumentMinus', component: HeroIcons.DocumentMinusIcon, category: 'Files', searchTerms: ['remove', 'delete', 'file'] },
  { name: 'DocumentPlus', component: HeroIcons.DocumentPlusIcon, category: 'Files', searchTerms: ['new', 'add', 'create', 'file'] },
  { name: 'DocumentCurrencyBangladeshi', component: HeroIcons.DocumentCurrencyBangladeshiIcon, category: 'Files', searchTerms: ['invoice', 'bill', 'money', 'receipt'] },
  { name: 'DocumentCurrencyDollar', component: HeroIcons.DocumentCurrencyDollarIcon, category: 'Files', searchTerms: ['invoice', 'bill', 'money', 'receipt', 'financial'] },
  { name: 'DocumentCurrencyEuro', component: HeroIcons.DocumentCurrencyEuroIcon, category: 'Files', searchTerms: ['invoice', 'bill', 'money', 'receipt'] },
  { name: 'DocumentCurrencyPound', component: HeroIcons.DocumentCurrencyPoundIcon, category: 'Files', searchTerms: ['invoice', 'bill', 'money', 'receipt'] },
  { name: 'DocumentCurrencyRupee', component: HeroIcons.DocumentCurrencyRupeeIcon, category: 'Files', searchTerms: ['invoice', 'bill', 'money', 'receipt'] },
  { name: 'DocumentCurrencyYen', component: HeroIcons.DocumentCurrencyYenIcon, category: 'Files', searchTerms: ['invoice', 'bill', 'money', 'receipt'] },
  { name: 'Folder', component: HeroIcons.FolderIcon, category: 'Files', searchTerms: ['directory', 'folder', 'organize'] },
  { name: 'FolderOpen', component: HeroIcons.FolderOpenIcon, category: 'Files', searchTerms: ['directory', 'open', 'browse'] },
  { name: 'FolderPlus', component: HeroIcons.FolderPlusIcon, category: 'Files', searchTerms: ['new folder', 'create', 'add'] },
  { name: 'FolderMinus', component: HeroIcons.FolderMinusIcon, category: 'Files', searchTerms: ['remove folder', 'delete'] },
  { name: 'FolderArrowDown', component: HeroIcons.FolderArrowDownIcon, category: 'Files', searchTerms: ['download', 'folder', 'export'] },
  { name: 'ArchiveBox', component: HeroIcons.ArchiveBoxIcon, category: 'Files', searchTerms: ['archive', 'box', 'storage', 'zip'] },
  { name: 'ArchiveBoxArrowDown', component: HeroIcons.ArchiveBoxArrowDownIcon, category: 'Files', searchTerms: ['archive', 'download', 'extract'] },
  { name: 'ArchiveBoxXMark', component: HeroIcons.ArchiveBoxXMarkIcon, category: 'Files', searchTerms: ['unarchive', 'remove', 'delete'] },
  { name: 'Clipboard', component: HeroIcons.ClipboardIcon, category: 'Files', searchTerms: ['copy', 'paste', 'clipboard'] },
  { name: 'ClipboardDocument', component: HeroIcons.ClipboardDocumentIcon, category: 'Files', searchTerms: ['copy', 'paste', 'duplicate'] },
  { name: 'ClipboardDocumentCheck', component: HeroIcons.ClipboardDocumentCheckIcon, category: 'Files', searchTerms: ['copied', 'complete', 'task'] },
  { name: 'ClipboardDocumentList', component: HeroIcons.ClipboardDocumentListIcon, category: 'Files', searchTerms: ['checklist', 'tasks', 'todo', 'list'] },
  { name: 'Newspaper', component: HeroIcons.NewspaperIcon, category: 'Files', searchTerms: ['news', 'article', 'blog', 'press'] },
  { name: 'BookOpen', component: HeroIcons.BookOpenIcon, category: 'Files', searchTerms: ['read', 'documentation', 'manual', 'guide', 'library'] },

  // Shopping (cart, currency, business)
  { name: 'ShoppingCart', component: HeroIcons.ShoppingCartIcon, category: 'Shopping', searchTerms: ['cart', 'buy', 'purchase', 'shop', 'ecommerce', 'basket'] },
  { name: 'ShoppingBag', component: HeroIcons.ShoppingBagIcon, category: 'Shopping', searchTerms: ['bag', 'buy', 'purchase', 'shop', 'retail'] },
  { name: 'CurrencyDollar', component: HeroIcons.CurrencyDollarIcon, category: 'Shopping', searchTerms: ['money', 'cash', 'dollar', 'usd', 'payment', 'finance', 'price', '$'] },
  { name: 'CurrencyEuro', component: HeroIcons.CurrencyEuroIcon, category: 'Shopping', searchTerms: ['money', 'cash', 'euro', 'eur', 'payment', 'finance', 'price', '€'] },
  { name: 'CurrencyPound', component: HeroIcons.CurrencyPoundIcon, category: 'Shopping', searchTerms: ['money', 'cash', 'pound', 'gbp', 'payment', 'finance', 'price', '£'] },
  { name: 'CurrencyYen', component: HeroIcons.CurrencyYenIcon, category: 'Shopping', searchTerms: ['money', 'cash', 'yen', 'jpy', 'payment', 'finance', 'price', '¥'] },
  { name: 'CurrencyRupee', component: HeroIcons.CurrencyRupeeIcon, category: 'Shopping', searchTerms: ['money', 'cash', 'rupee', 'inr', 'payment', 'finance', 'price', '₹'] },
  { name: 'CurrencyBangladeshi', component: HeroIcons.CurrencyBangladeshiIcon, category: 'Shopping', searchTerms: ['money', 'cash', 'taka', 'bdt', 'payment', 'finance', 'price'] },
  { name: 'CreditCard', component: HeroIcons.CreditCardIcon, category: 'Shopping', searchTerms: ['money', 'payment', 'card', 'debit', 'visa', 'mastercard', 'pay', 'transaction'] },
  { name: 'Wallet', component: HeroIcons.WalletIcon, category: 'Shopping', searchTerms: ['money', 'cash', 'payment', 'billfold', 'finance'] },
  { name: 'Banknotes', component: HeroIcons.BanknotesIcon, category: 'Shopping', searchTerms: ['money', 'cash', 'bills', 'currency', 'payment', 'finance', 'dollar'] },
  { name: 'ReceiptPercent', component: HeroIcons.ReceiptPercentIcon, category: 'Shopping', searchTerms: ['discount', 'sale', 'coupon', 'invoice', 'bill'] },
  { name: 'ReceiptRefund', component: HeroIcons.ReceiptRefundIcon, category: 'Shopping', searchTerms: ['return', 'refund', 'invoice', 'bill', 'money back'] },
  { name: 'Ticket', component: HeroIcons.TicketIcon, category: 'Shopping', searchTerms: ['coupon', 'voucher', 'pass', 'admission', 'event'] },
  { name: 'Tag', component: HeroIcons.TagIcon, category: 'Shopping', searchTerms: ['label', 'price', 'sale', 'discount', 'category'] },
  { name: 'PercentBadge', component: HeroIcons.PercentBadgeIcon, category: 'Shopping', searchTerms: ['discount', 'sale', 'off', 'deal', 'savings'] },
  { name: 'BuildingStorefront', component: HeroIcons.BuildingStorefrontIcon, category: 'Shopping', searchTerms: ['shop', 'store', 'retail', 'business', 'merchant'] },
  { name: 'Gift', component: HeroIcons.GiftIcon, category: 'Shopping', searchTerms: ['present', 'birthday', 'christmas', 'reward', 'surprise'] },
  { name: 'GiftTop', component: HeroIcons.GiftTopIcon, category: 'Shopping', searchTerms: ['present', 'birthday', 'christmas', 'reward', 'surprise'] },

  // Weather (sun, moon, cloud)
  { name: 'Sun', component: HeroIcons.SunIcon, category: 'Weather', searchTerms: ['light', 'day', 'bright', 'sunny', 'weather', 'light mode'] },
  { name: 'Moon', component: HeroIcons.MoonIcon, category: 'Weather', searchTerms: ['night', 'dark', 'sleep', 'dark mode', 'weather'] },

  // Interface (settings, adjustments, UI elements)
  { name: 'AdjustmentsHorizontal', component: HeroIcons.AdjustmentsHorizontalIcon, category: 'Interface', searchTerms: ['settings', 'controls', 'sliders', 'filters', 'options', 'preferences'] },
  { name: 'AdjustmentsVertical', component: HeroIcons.AdjustmentsVerticalIcon, category: 'Interface', searchTerms: ['settings', 'controls', 'sliders', 'filters', 'options', 'preferences'] },
  { name: 'Bars2', component: HeroIcons.Bars2Icon, category: 'Interface', searchTerms: ['menu', 'hamburger', 'navigation', 'lines'] },
  { name: 'Bars3', component: HeroIcons.Bars3Icon, category: 'Interface', searchTerms: ['menu', 'hamburger', 'navigation', 'lines'] },
  { name: 'Bars3BottomLeft', component: HeroIcons.Bars3BottomLeftIcon, category: 'Interface', searchTerms: ['menu', 'text', 'align', 'left'] },
  { name: 'Bars3BottomRight', component: HeroIcons.Bars3BottomRightIcon, category: 'Interface', searchTerms: ['menu', 'text', 'align', 'right'] },
  { name: 'Bars3CenterLeft', component: HeroIcons.Bars3CenterLeftIcon, category: 'Interface', searchTerms: ['menu', 'text', 'align', 'center'] },
  { name: 'Bars4', component: HeroIcons.Bars4Icon, category: 'Interface', searchTerms: ['menu', 'lines', 'list', 'justify'] },
  { name: 'BarsArrowDown', component: HeroIcons.BarsArrowDownIcon, category: 'Interface', searchTerms: ['sort', 'descending', 'order', 'filter'] },
  { name: 'BarsArrowUp', component: HeroIcons.BarsArrowUpIcon, category: 'Interface', searchTerms: ['sort', 'ascending', 'order', 'filter'] },
  { name: 'EllipsisHorizontal', component: HeroIcons.EllipsisHorizontalIcon, category: 'Interface', searchTerms: ['more', 'menu', 'options', 'dots', '...'] },
  { name: 'EllipsisHorizontalCircle', component: HeroIcons.EllipsisHorizontalCircleIcon, category: 'Interface', searchTerms: ['more', 'menu', 'options', 'dots'] },
  { name: 'EllipsisVertical', component: HeroIcons.EllipsisVerticalIcon, category: 'Interface', searchTerms: ['more', 'menu', 'options', 'dots', 'kebab'] },
  { name: 'QueueList', component: HeroIcons.QueueListIcon, category: 'Interface', searchTerms: ['playlist', 'queue', 'list', 'items'] },
  { name: 'ListBullet', component: HeroIcons.ListBulletIcon, category: 'Interface', searchTerms: ['list', 'bullet', 'items', 'unordered'] },
  { name: 'NumberedList', component: HeroIcons.NumberedListIcon, category: 'Interface', searchTerms: ['list', 'numbered', 'ordered', 'items'] },
  { name: 'ViewColumns', component: HeroIcons.ViewColumnsIcon, category: 'Interface', searchTerms: ['columns', 'layout', 'grid', 'kanban', 'board'] },
  { name: 'TableCells', component: HeroIcons.TableCellsIcon, category: 'Interface', searchTerms: ['table', 'grid', 'spreadsheet', 'data', 'excel'] },
  { name: 'Funnel', component: HeroIcons.FunnelIcon, category: 'Interface', searchTerms: ['filter', 'sort', 'refine', 'narrow'] },
  { name: 'MagnifyingGlassCircle', component: HeroIcons.MagnifyingGlassCircleIcon, category: 'Interface', searchTerms: ['search', 'find', 'lookup'] },
  { name: 'MagnifyingGlassPlus', component: HeroIcons.MagnifyingGlassPlusIcon, category: 'Interface', searchTerms: ['zoom in', 'enlarge', 'magnify'] },
  { name: 'MagnifyingGlassMinus', component: HeroIcons.MagnifyingGlassMinusIcon, category: 'Interface', searchTerms: ['zoom out', 'shrink', 'reduce'] },
  { name: 'Eye', component: HeroIcons.EyeIcon, category: 'Interface', searchTerms: ['view', 'visible', 'show', 'watch', 'preview', 'see'] },
  { name: 'EyeSlash', component: HeroIcons.EyeSlashIcon, category: 'Interface', searchTerms: ['hide', 'hidden', 'invisible', 'private', 'password'] },
  { name: 'InformationCircle', component: HeroIcons.InformationCircleIcon, category: 'Interface', searchTerms: ['info', 'help', 'about', 'details', 'i'] },
  { name: 'QuestionMarkCircle', component: HeroIcons.QuestionMarkCircleIcon, category: 'Interface', searchTerms: ['help', 'support', 'faq', 'question', '?'] },
  { name: 'ExclamationCircle', component: HeroIcons.ExclamationCircleIcon, category: 'Interface', searchTerms: ['error', 'warning', 'alert', 'important', '!'] },
  { name: 'ExclamationTriangle', component: HeroIcons.ExclamationTriangleIcon, category: 'Interface', searchTerms: ['warning', 'caution', 'alert', 'danger'] },
  { name: 'NoSymbol', component: HeroIcons.NoSymbolIcon, category: 'Interface', searchTerms: ['forbidden', 'blocked', 'prohibited', 'banned', 'cancel'] },
  { name: 'Inbox', component: HeroIcons.InboxIcon, category: 'Interface', searchTerms: ['mail', 'messages', 'email', 'received'] },
  { name: 'InboxArrowDown', component: HeroIcons.InboxArrowDownIcon, category: 'Interface', searchTerms: ['receive', 'incoming', 'download', 'mail'] },
  { name: 'InboxStack', component: HeroIcons.InboxStackIcon, category: 'Interface', searchTerms: ['all mail', 'messages', 'archive'] },
  { name: 'ViewfinderCircle', component: HeroIcons.ViewfinderCircleIcon, category: 'Interface', searchTerms: ['focus', 'target', 'scan', 'camera'] },
  { name: 'Wifi', component: HeroIcons.WifiIcon, category: 'Interface', searchTerms: ['internet', 'network', 'wireless', 'connection', 'signal'] },
  { name: 'CursorArrowRays', component: HeroIcons.CursorArrowRaysIcon, category: 'Interface', searchTerms: ['click', 'cursor', 'pointer', 'select'] },
  { name: 'CursorArrowRipple', component: HeroIcons.CursorArrowRippleIcon, category: 'Interface', searchTerms: ['click', 'cursor', 'pointer', 'touch'] },

  // Shapes (squares, circles, geometric shapes)
  { name: 'Square2Stack', component: HeroIcons.Square2StackIcon, category: 'Shapes', searchTerms: ['copy', 'duplicate', 'layers', 'stack'] },
  { name: 'Square3Stack3D', component: HeroIcons.Square3Stack3DIcon, category: 'Shapes', searchTerms: ['layers', 'stack', '3d', 'depth'] },
  { name: 'Squares2X2', component: HeroIcons.Squares2X2Icon, category: 'Shapes', searchTerms: ['grid', 'apps', 'dashboard', 'tiles', 'windows'] },
  { name: 'SquaresPlus', component: HeroIcons.SquaresPlusIcon, category: 'Shapes', searchTerms: ['add', 'new', 'widget', 'dashboard'] },
  { name: 'RectangleGroup', component: HeroIcons.RectangleGroupIcon, category: 'Shapes', searchTerms: ['layout', 'group', 'sections', 'organize'] },
  { name: 'RectangleStack', component: HeroIcons.RectangleStackIcon, category: 'Shapes', searchTerms: ['cards', 'layers', 'collection', 'stack'] },

  // Text Formatting (bold, italic, etc.)
  { name: 'Bold', component: HeroIcons.BoldIcon, category: 'Text Formatting', searchTerms: ['strong', 'font', 'text', 'weight', 'B'] },
  { name: 'Italic', component: HeroIcons.ItalicIcon, category: 'Text Formatting', searchTerms: ['slant', 'font', 'text', 'emphasis', 'I'] },
  { name: 'Underline', component: HeroIcons.UnderlineIcon, category: 'Text Formatting', searchTerms: ['text', 'font', 'decoration', 'U'] },
  { name: 'Strikethrough', component: HeroIcons.StrikethroughIcon, category: 'Text Formatting', searchTerms: ['cross out', 'delete', 'line through', 'text'] },
  { name: 'H1', component: HeroIcons.H1Icon, category: 'Text Formatting', searchTerms: ['heading', 'title', 'header', 'h1'] },
  { name: 'H2', component: HeroIcons.H2Icon, category: 'Text Formatting', searchTerms: ['heading', 'subtitle', 'header', 'h2'] },
  { name: 'H3', component: HeroIcons.H3Icon, category: 'Text Formatting', searchTerms: ['heading', 'header', 'h3'] },
  { name: 'Link', component: HeroIcons.LinkIcon, category: 'Text Formatting', searchTerms: ['url', 'hyperlink', 'chain', 'connect', 'href'] },
  { name: 'LinkSlash', component: HeroIcons.LinkSlashIcon, category: 'Text Formatting', searchTerms: ['unlink', 'broken', 'disconnect'] },
  { name: 'Language', component: HeroIcons.LanguageIcon, category: 'Text Formatting', searchTerms: ['translate', 'i18n', 'globe', 'localization', 'international'] },

  // Charts & Analytics (graphs, charts, presentations)
  { name: 'ChartBar', component: HeroIcons.ChartBarIcon, category: 'Charts & Analytics', searchTerms: ['graph', 'stats', 'statistics', 'analytics', 'data', 'metrics'] },
  { name: 'ChartBarSquare', component: HeroIcons.ChartBarSquareIcon, category: 'Charts & Analytics', searchTerms: ['graph', 'stats', 'statistics', 'analytics', 'data'] },
  { name: 'ChartPie', component: HeroIcons.ChartPieIcon, category: 'Charts & Analytics', searchTerms: ['graph', 'pie chart', 'analytics', 'percentage', 'donut'] },
  { name: 'PresentationChartBar', component: HeroIcons.PresentationChartBarIcon, category: 'Charts & Analytics', searchTerms: ['slides', 'presentation', 'analytics', 'report', 'meeting'] },
  { name: 'PresentationChartLine', component: HeroIcons.PresentationChartLineIcon, category: 'Charts & Analytics', searchTerms: ['slides', 'presentation', 'analytics', 'trends', 'meeting'] },

  // Security (lock, key, shield, etc.)
  { name: 'LockClosed', component: HeroIcons.LockClosedIcon, category: 'Security', searchTerms: ['locked', 'secure', 'password', 'private', 'protected'] },
  { name: 'LockOpen', component: HeroIcons.LockOpenIcon, category: 'Security', searchTerms: ['unlocked', 'open', 'public', 'unsecure'] },
  { name: 'Key', component: HeroIcons.KeyIcon, category: 'Security', searchTerms: ['password', 'access', 'unlock', 'login', 'auth', 'api'] },
  { name: 'ShieldCheck', component: HeroIcons.ShieldCheckIcon, category: 'Security', searchTerms: ['secure', 'protected', 'safe', 'verified', 'antivirus'] },
  { name: 'ShieldExclamation', component: HeroIcons.ShieldExclamationIcon, category: 'Security', searchTerms: ['warning', 'alert', 'security', 'risk'] },
  { name: 'FingerPrint', component: HeroIcons.FingerPrintIcon, category: 'Security', searchTerms: ['biometric', 'identity', 'auth', 'touch', 'scan'] },
  { name: 'Identification', component: HeroIcons.IdentificationIcon, category: 'Security', searchTerms: ['id', 'badge', 'card', 'identity', 'profile'] },

  // Location & Travel (map, pin, globe, etc.)
  { name: 'Map', component: HeroIcons.MapIcon, category: 'Location & Travel', searchTerms: ['location', 'directions', 'navigation', 'geography'] },
  { name: 'MapPin', component: HeroIcons.MapPinIcon, category: 'Location & Travel', searchTerms: ['location', 'place', 'marker', 'pin', 'gps', 'address'] },
  { name: 'GlobeAlt', component: HeroIcons.GlobeAltIcon, category: 'Location & Travel', searchTerms: ['world', 'earth', 'internet', 'web', 'global', 'international'] },
  { name: 'GlobeAmericas', component: HeroIcons.GlobeAmericasIcon, category: 'Location & Travel', searchTerms: ['world', 'earth', 'america', 'usa', 'north', 'south'] },
  { name: 'GlobeAsiaAustralia', component: HeroIcons.GlobeAsiaAustraliaIcon, category: 'Location & Travel', searchTerms: ['world', 'earth', 'asia', 'australia', 'pacific'] },
  { name: 'GlobeEuropeAfrica', component: HeroIcons.GlobeEuropeAfricaIcon, category: 'Location & Travel', searchTerms: ['world', 'earth', 'europe', 'africa', 'emea'] },
  { name: 'Truck', component: HeroIcons.TruckIcon, category: 'Location & Travel', searchTerms: ['delivery', 'shipping', 'transport', 'vehicle', 'moving', 'freight'] },
  { name: 'RocketLaunch', component: HeroIcons.RocketLaunchIcon, category: 'Location & Travel', searchTerms: ['launch', 'startup', 'fast', 'speed', 'space', 'deploy'] },

  // Business & Office (briefcase, building, calendar, etc.)
  { name: 'Briefcase', component: HeroIcons.BriefcaseIcon, category: 'Business & Office', searchTerms: ['work', 'job', 'career', 'business', 'portfolio', 'professional'] },
  { name: 'BuildingOffice', component: HeroIcons.BuildingOfficeIcon, category: 'Business & Office', searchTerms: ['company', 'work', 'corporate', 'headquarters', 'business'] },
  { name: 'BuildingOffice2', component: HeroIcons.BuildingOffice2Icon, category: 'Business & Office', searchTerms: ['company', 'work', 'corporate', 'skyscraper', 'business'] },
  { name: 'BuildingLibrary', component: HeroIcons.BuildingLibraryIcon, category: 'Business & Office', searchTerms: ['bank', 'government', 'institution', 'museum', 'library'] },
  { name: 'HomeModern', component: HeroIcons.HomeModernIcon, category: 'Business & Office', searchTerms: ['house', 'real estate', 'property', 'architecture'] },
  { name: 'Calendar', component: HeroIcons.CalendarIcon, category: 'Business & Office', searchTerms: ['date', 'schedule', 'event', 'appointment', 'planner'] },
  { name: 'CalendarDays', component: HeroIcons.CalendarDaysIcon, category: 'Business & Office', searchTerms: ['date', 'schedule', 'event', 'month', 'planner'] },
  { name: 'CalendarDateRange', component: HeroIcons.CalendarDateRangeIcon, category: 'Business & Office', searchTerms: ['date range', 'period', 'schedule', 'booking'] },
  { name: 'Clock', component: HeroIcons.ClockIcon, category: 'Business & Office', searchTerms: ['time', 'schedule', 'hour', 'watch', 'timer', 'history'] },
  { name: 'Calculator', component: HeroIcons.CalculatorIcon, category: 'Business & Office', searchTerms: ['math', 'calculate', 'numbers', 'accounting', 'finance'] },
  { name: 'Scale', component: HeroIcons.ScaleIcon, category: 'Business & Office', searchTerms: ['balance', 'justice', 'law', 'legal', 'compare', 'weigh'] },

  // Education (academic cap, book, beaker, etc.)
  { name: 'AcademicCap', component: HeroIcons.AcademicCapIcon, category: 'Education', searchTerms: ['graduation', 'school', 'university', 'college', 'student', 'degree'] },
  { name: 'Beaker', component: HeroIcons.BeakerIcon, category: 'Education', searchTerms: ['science', 'lab', 'chemistry', 'experiment', 'research', 'test'] },
  { name: 'LightBulb', component: HeroIcons.LightBulbIcon, category: 'Education', searchTerms: ['idea', 'innovation', 'insight', 'tip', 'creative', 'bright'] },

  // Devices (phone, tablet, desktop)
  { name: 'DevicePhoneMobile', component: HeroIcons.DevicePhoneMobileIcon, category: 'Devices', searchTerms: ['phone', 'mobile', 'smartphone', 'cell', 'iphone', 'android'] },
  { name: 'DeviceTablet', component: HeroIcons.DeviceTabletIcon, category: 'Devices', searchTerms: ['tablet', 'ipad', 'screen', 'device', 'portable'] },

  // Math & Symbols (plus, minus, equals, etc.)
  { name: 'Equals', component: HeroIcons.EqualsIcon, category: 'Math & Symbols', searchTerms: ['equal', 'same', 'match', '=', 'math'] },
  { name: 'Divide', component: HeroIcons.DivideIcon, category: 'Math & Symbols', searchTerms: ['division', 'split', '÷', 'math', 'separate'] },
  { name: 'Slash', component: HeroIcons.SlashIcon, category: 'Math & Symbols', searchTerms: ['divide', 'or', '/', 'separator'] },

  // Miscellaneous (everything else)
  { name: 'Trophy', component: HeroIcons.TrophyIcon, category: 'Miscellaneous', searchTerms: ['award', 'winner', 'achievement', 'prize', 'cup', 'competition'] },
  { name: 'PuzzlePiece', component: HeroIcons.PuzzlePieceIcon, category: 'Miscellaneous', searchTerms: ['plugin', 'extension', 'addon', 'integration', 'module', 'piece'] },
  { name: 'Bolt', component: HeroIcons.BoltIcon, category: 'Miscellaneous', searchTerms: ['lightning', 'power', 'fast', 'electric', 'flash', 'speed', 'energy'] },
  { name: 'BoltSlash', component: HeroIcons.BoltSlashIcon, category: 'Miscellaneous', searchTerms: ['no power', 'offline', 'disabled', 'slow'] },
  { name: 'Lifebuoy', component: HeroIcons.LifebuoyIcon, category: 'Miscellaneous', searchTerms: ['help', 'support', 'rescue', 'assistance', 'life ring'] },
  { name: 'Cake', component: HeroIcons.CakeIcon, category: 'Miscellaneous', searchTerms: ['birthday', 'celebration', 'party', 'dessert', 'anniversary'] },
  { name: 'FaceFrown', component: HeroIcons.FaceFrownIcon, category: 'Miscellaneous', searchTerms: ['sad', 'unhappy', 'emoji', 'disappointed', 'negative'] },
  { name: 'FaceSmile', component: HeroIcons.FaceSmileIcon, category: 'Miscellaneous', searchTerms: ['happy', 'smile', 'emoji', 'positive', 'satisfied'] },
  { name: 'Battery0', component: HeroIcons.Battery0Icon, category: 'Miscellaneous', searchTerms: ['empty', 'dead', 'low power', 'charge'] },
  { name: 'Battery50', component: HeroIcons.Battery50Icon, category: 'Miscellaneous', searchTerms: ['half', 'charging', 'power', 'medium'] },
  { name: 'Battery100', component: HeroIcons.Battery100Icon, category: 'Miscellaneous', searchTerms: ['full', 'charged', 'power', 'complete'] },
  { name: 'ArrowLeftEndOnRectangle', component: HeroIcons.ArrowLeftEndOnRectangleIcon, category: 'Miscellaneous', searchTerms: ['logout', 'sign out', 'exit', 'leave'] },
  { name: 'ArrowLeftOnRectangle', component: HeroIcons.ArrowLeftOnRectangleIcon, category: 'Miscellaneous', searchTerms: ['logout', 'sign out', 'exit', 'leave'] },
  { name: 'ArrowLeftStartOnRectangle', component: HeroIcons.ArrowLeftStartOnRectangleIcon, category: 'Miscellaneous', searchTerms: ['logout', 'sign out', 'exit', 'leave'] },
  { name: 'ArrowRightEndOnRectangle', component: HeroIcons.ArrowRightEndOnRectangleIcon, category: 'Miscellaneous', searchTerms: ['login', 'sign in', 'enter', 'access'] },
  { name: 'ArrowRightOnRectangle', component: HeroIcons.ArrowRightOnRectangleIcon, category: 'Miscellaneous', searchTerms: ['login', 'sign in', 'enter', 'access'] },
  { name: 'ArrowRightStartOnRectangle', component: HeroIcons.ArrowRightStartOnRectangleIcon, category: 'Miscellaneous', searchTerms: ['login', 'sign in', 'enter', 'access'] },

]

// Automatically generate all Material Design Icons
const generateMdiIcons = (): IconOption[] => {
  const mdiIcons: IconOption[] = []

  try {
    // Iterate through all exports from @mdi/js
    for (const [key, value] of Object.entries(MdiPaths)) {
      // Process all exports that start with 'mdi' and are strings (icon paths)
      if (key.startsWith('mdi') && typeof value === 'string') {
        try {
          // Convert mdiIconName to Icon Name
          const rawName = key.replace(/^mdi/, '')
          const displayName = rawName
            // Add space before capital letters
            .replace(/([A-Z])/g, ' $1')
            .trim()

          // Create search terms for better matching
          const searchTerms = [
            rawName.toLowerCase(), // original: github
            displayName.toLowerCase(), // spaced: github
            key.toLowerCase(), // full key: mdigithub
            // Split camelCase into individual words
            ...rawName.split(/(?=[A-Z])/).map(word => word.toLowerCase()).filter(Boolean)
          ].filter(Boolean) // Remove any empty strings

      // Basic categorization based on name patterns
      let category = 'MDI Icons'

      if (/(Dog|Cat|Fish|Bird|Butterfly|Bug|Bee|Spider|Ant|Ladybug|Snail|Turtle|Rabbit|Bear|Fox|Lion|Tiger|Elephant|Giraffe|Monkey|Panda|Penguin|Owl|Eagle|Crow|Duck|Chicken|Cow|Pig|Sheep|Horse|Deer|Mouse|Rat|Squirrel|Hedgehog|Frog|Snake|Lizard|Dolphin|Whale|Shark|Octopus|Jellyfish|Crab|Lobster|Scorpion|Beetle|Moth|Fly|Mosquito|Dragonfly|Grasshopper|Cricket|Cockroach|Firefly|Worm|Caterpillar|Dinosaur|Dragon|Unicorn|Animal|Pet)/i.test(rawName)) {
        category = 'Animals'
      } else if (/(Github|Google|Facebook|Twitter|X[A-Z]|Linkedin|Instagram|Youtube|Reddit|Slack|Discord|Telegram|Whatsapp|Mastodon|Tiktok|Snapchat|Pinterest|Tumblr|Vimeo|Twitch|Bluesky|Signal|Skype|Viber|Line|Wechat|Matrix|Social)/i.test(rawName)) {
        category = 'Social Media'
      } else if (/(Atlassian|Jira|Confluence|Trello|Asana|Monday|Notion|Airtable|Salesforce|Hubspot|Mailchimp|Stripe|Paypal|Shopify|Woocommerce|WordPress|Drupal|Joomla)/i.test(rawName)) {
        category = 'Business Platforms'
      } else if (/(Docker|Git|Npm|Node|React|Angular|Vue|Python|Javascript|Typescript|Html|Css|Php|Java|Kubernetes|Aws|Azure|Cloudflare|Digitalocean|Heroku|Vercel|Netlify|Language|Code|Dev|Api|Database|Server|Terminal|Console|Bash)/i.test(rawName)) {
        category = 'Development'
      } else if (/(Home|House|Light|Bulb|Thermostat|Lock(?!Open)|Door|Camera|Cctv|Smart|Iot|Automation|Assistant)/i.test(rawName)) {
        category = 'Home & IoT'
      } else if (/(Weather|Cloud|Rain|Snow|Sun|Temperature|Umbrella|Storm|Lightning|Fog|Wind)/i.test(rawName)) {
        category = 'Weather'
      } else if (/(Music|Video|Play|Pause|Film|Movie|Camera|Image|Photo|Spotify|Netflix|Plex|Audio|Speaker|Volume)/i.test(rawName)) {
        category = 'Media'
      } else if (/(File|Folder|Document|Archive|Download|Upload|Drive|Dropbox|Save|Pdf|Zip)/i.test(rawName)) {
        category = 'Files'
      } else if (/(Cart|Shop|Store|Currency|Dollar|Euro|Credit|Wallet|Package|Box|Bag|Purchase)/i.test(rawName)) {
        category = 'Shopping'
      } else if (/(Shield|Key|Security|Vpn|Fingerprint|Incognito|Password|Auth|Lock(?=Open|Closed)|Safe)/i.test(rawName)) {
        category = 'Security'
      } else if (/(Calendar|Clock|Brief|Office|Building|Meeting|Presentation|Business|Work)/i.test(rawName)) {
        category = 'Business & Office'
      } else if (/(Arrow|Chevron|Navigation|Menu|Bars|Back|Forward|Direction)/i.test(rawName)) {
        category = 'Navigation'
      } else if (/(Alert|Info|Help|Warning|Error|Check|Cross|Close|Plus|Minus|Settings|Cog|Notification|Bell)/i.test(rawName)) {
        category = 'Interface'
      }

          mdiIcons.push({
            name: displayName,
            component: createMdiIcon(value),
            category,
            searchTerms
          })
        } catch (iconError) {
          console.error(`Error creating icon ${key}:`, iconError)
          // Continue processing other icons
        }
      }
    }
  } catch (error) {
    console.error('Error generating MDI icons:', error)
  }

  return mdiIcons
}

// Combine Heroicons with all MDI icons
try {
  const mdiIcons = generateMdiIcons()
  console.log(`Generated ${mdiIcons.length} MDI icons`)
  AVAILABLE_ICONS.push(...mdiIcons)
} catch (error) {
  console.error('Failed to generate MDI icons:', error)
  // Continue with just Heroicons
}

export const ICON_CATEGORIES = Array.from(
  new Set(AVAILABLE_ICONS.map(icon => icon.category))
).sort()

export const getIconByName = (name: string): IconOption | undefined => {
  if (!name) return undefined
  return AVAILABLE_ICONS.find(icon => icon.name === name)
}
