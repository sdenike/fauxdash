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
  { name: 'Home', component: HeroIcons.HomeIcon, category: 'Common' },
  { name: 'Star', component: HeroIcons.StarIcon, category: 'Common' },
  { name: 'Heart', component: HeroIcons.HeartIcon, category: 'Common' },
  { name: 'Bookmark', component: HeroIcons.BookmarkIcon, category: 'Common' },
  { name: 'BookmarkSlash', component: HeroIcons.BookmarkSlashIcon, category: 'Common' },
  { name: 'BookmarkSquare', component: HeroIcons.BookmarkSquareIcon, category: 'Common' },
  { name: 'Fire', component: HeroIcons.FireIcon, category: 'Common' },
  { name: 'Sparkles', component: HeroIcons.SparklesIcon, category: 'Common' },
  { name: 'Bell', component: HeroIcons.BellIcon, category: 'Common' },
  { name: 'BellAlert', component: HeroIcons.BellAlertIcon, category: 'Common' },
  { name: 'BellSlash', component: HeroIcons.BellSlashIcon, category: 'Common' },
  { name: 'BellSnooze', component: HeroIcons.BellSnoozeIcon, category: 'Common' },
  { name: 'MagnifyingGlass', component: HeroIcons.MagnifyingGlassIcon, category: 'Common' },
  { name: 'Flag', component: HeroIcons.FlagIcon, category: 'Common' },
  { name: 'Trash', component: HeroIcons.TrashIcon, category: 'Common' },
  { name: 'Check', component: HeroIcons.CheckIcon, category: 'Common' },
  { name: 'CheckCircle', component: HeroIcons.CheckCircleIcon, category: 'Common' },
  { name: 'CheckBadge', component: HeroIcons.CheckBadgeIcon, category: 'Common' },
  { name: 'XMark', component: HeroIcons.XMarkIcon, category: 'Common' },
  { name: 'XCircle', component: HeroIcons.XCircleIcon, category: 'Common' },

  // Navigation (arrows, directions, movement)
  { name: 'ArrowUp', component: HeroIcons.ArrowUpIcon, category: 'Navigation' },
  { name: 'ArrowDown', component: HeroIcons.ArrowDownIcon, category: 'Navigation' },
  { name: 'ArrowLeft', component: HeroIcons.ArrowLeftIcon, category: 'Navigation' },
  { name: 'ArrowRight', component: HeroIcons.ArrowRightIcon, category: 'Navigation' },
  { name: 'ArrowUpCircle', component: HeroIcons.ArrowUpCircleIcon, category: 'Navigation' },
  { name: 'ArrowDownCircle', component: HeroIcons.ArrowDownCircleIcon, category: 'Navigation' },
  { name: 'ArrowLeftCircle', component: HeroIcons.ArrowLeftCircleIcon, category: 'Navigation' },
  { name: 'ArrowRightCircle', component: HeroIcons.ArrowRightCircleIcon, category: 'Navigation' },
  { name: 'ArrowUpLeft', component: HeroIcons.ArrowUpLeftIcon, category: 'Navigation' },
  { name: 'ArrowUpRight', component: HeroIcons.ArrowUpRightIcon, category: 'Navigation' },
  { name: 'ArrowDownLeft', component: HeroIcons.ArrowDownLeftIcon, category: 'Navigation' },
  { name: 'ArrowDownRight', component: HeroIcons.ArrowDownRightIcon, category: 'Navigation' },
  { name: 'ArrowLongUp', component: HeroIcons.ArrowLongUpIcon, category: 'Navigation' },
  { name: 'ArrowLongDown', component: HeroIcons.ArrowLongDownIcon, category: 'Navigation' },
  { name: 'ArrowLongLeft', component: HeroIcons.ArrowLongLeftIcon, category: 'Navigation' },
  { name: 'ArrowLongRight', component: HeroIcons.ArrowLongRightIcon, category: 'Navigation' },
  { name: 'ArrowSmallUp', component: HeroIcons.ArrowSmallUpIcon, category: 'Navigation' },
  { name: 'ArrowSmallDown', component: HeroIcons.ArrowSmallDownIcon, category: 'Navigation' },
  { name: 'ArrowSmallLeft', component: HeroIcons.ArrowSmallLeftIcon, category: 'Navigation' },
  { name: 'ArrowSmallRight', component: HeroIcons.ArrowSmallRightIcon, category: 'Navigation' },
  { name: 'ArrowUturnUp', component: HeroIcons.ArrowUturnUpIcon, category: 'Navigation' },
  { name: 'ArrowUturnDown', component: HeroIcons.ArrowUturnDownIcon, category: 'Navigation' },
  { name: 'ArrowUturnLeft', component: HeroIcons.ArrowUturnLeftIcon, category: 'Navigation' },
  { name: 'ArrowUturnRight', component: HeroIcons.ArrowUturnRightIcon, category: 'Navigation' },
  { name: 'ArrowPath', component: HeroIcons.ArrowPathIcon, category: 'Navigation' },
  { name: 'ArrowPathRoundedSquare', component: HeroIcons.ArrowPathRoundedSquareIcon, category: 'Navigation' },
  { name: 'ArrowTopRightOnSquare', component: HeroIcons.ArrowTopRightOnSquareIcon, category: 'Navigation' },
  { name: 'ArrowsPointingIn', component: HeroIcons.ArrowsPointingInIcon, category: 'Navigation' },
  { name: 'ArrowsPointingOut', component: HeroIcons.ArrowsPointingOutIcon, category: 'Navigation' },
  { name: 'ArrowsRightLeft', component: HeroIcons.ArrowsRightLeftIcon, category: 'Navigation' },
  { name: 'ArrowsUpDown', component: HeroIcons.ArrowsUpDownIcon, category: 'Navigation' },
  { name: 'ArrowTrendingUp', component: HeroIcons.ArrowTrendingUpIcon, category: 'Navigation' },
  { name: 'ArrowTrendingDown', component: HeroIcons.ArrowTrendingDownIcon, category: 'Navigation' },
  { name: 'ArrowTurnDownLeft', component: HeroIcons.ArrowTurnDownLeftIcon, category: 'Navigation' },
  { name: 'ArrowTurnDownRight', component: HeroIcons.ArrowTurnDownRightIcon, category: 'Navigation' },
  { name: 'ArrowTurnLeftDown', component: HeroIcons.ArrowTurnLeftDownIcon, category: 'Navigation' },
  { name: 'ArrowTurnLeftUp', component: HeroIcons.ArrowTurnLeftUpIcon, category: 'Navigation' },
  { name: 'ArrowTurnRightDown', component: HeroIcons.ArrowTurnRightDownIcon, category: 'Navigation' },
  { name: 'ArrowTurnRightUp', component: HeroIcons.ArrowTurnRightUpIcon, category: 'Navigation' },
  { name: 'ArrowTurnUpLeft', component: HeroIcons.ArrowTurnUpLeftIcon, category: 'Navigation' },
  { name: 'ArrowTurnUpRight', component: HeroIcons.ArrowTurnUpRightIcon, category: 'Navigation' },
  { name: 'ChevronUp', component: HeroIcons.ChevronUpIcon, category: 'Navigation' },
  { name: 'ChevronDown', component: HeroIcons.ChevronDownIcon, category: 'Navigation' },
  { name: 'ChevronLeft', component: HeroIcons.ChevronLeftIcon, category: 'Navigation' },
  { name: 'ChevronRight', component: HeroIcons.ChevronRightIcon, category: 'Navigation' },
  { name: 'ChevronDoubleUp', component: HeroIcons.ChevronDoubleUpIcon, category: 'Navigation' },
  { name: 'ChevronDoubleDown', component: HeroIcons.ChevronDoubleDownIcon, category: 'Navigation' },
  { name: 'ChevronDoubleLeft', component: HeroIcons.ChevronDoubleLeftIcon, category: 'Navigation' },
  { name: 'ChevronDoubleRight', component: HeroIcons.ChevronDoubleRightIcon, category: 'Navigation' },
  { name: 'ChevronUpDown', component: HeroIcons.ChevronUpDownIcon, category: 'Navigation' },
  { name: 'Backward', component: HeroIcons.BackwardIcon, category: 'Navigation' },
  { name: 'Forward', component: HeroIcons.ForwardIcon, category: 'Navigation' },

  // Actions (play, pause, stop, etc.)
  { name: 'Play', component: HeroIcons.PlayIcon, category: 'Actions' },
  { name: 'PlayCircle', component: HeroIcons.PlayCircleIcon, category: 'Actions' },
  { name: 'PlayPause', component: HeroIcons.PlayPauseIcon, category: 'Actions' },
  { name: 'Pause', component: HeroIcons.PauseIcon, category: 'Actions' },
  { name: 'PauseCircle', component: HeroIcons.PauseCircleIcon, category: 'Actions' },
  { name: 'Stop', component: HeroIcons.StopIcon, category: 'Actions' },
  { name: 'StopCircle', component: HeroIcons.StopCircleIcon, category: 'Actions' },
  { name: 'Plus', component: HeroIcons.PlusIcon, category: 'Actions' },
  { name: 'PlusCircle', component: HeroIcons.PlusCircleIcon, category: 'Actions' },
  { name: 'PlusSmall', component: HeroIcons.PlusSmallIcon, category: 'Actions' },
  { name: 'Minus', component: HeroIcons.MinusIcon, category: 'Actions' },
  { name: 'MinusCircle', component: HeroIcons.MinusCircleIcon, category: 'Actions' },
  { name: 'MinusSmall', component: HeroIcons.MinusSmallIcon, category: 'Actions' },
  { name: 'Pencil', component: HeroIcons.PencilIcon, category: 'Actions' },
  { name: 'PencilSquare', component: HeroIcons.PencilSquareIcon, category: 'Actions' },
  { name: 'Share', component: HeroIcons.ShareIcon, category: 'Actions' },
  { name: 'ArrowDownTray', component: HeroIcons.ArrowDownTrayIcon, category: 'Actions' },
  { name: 'ArrowUpTray', component: HeroIcons.ArrowUpTrayIcon, category: 'Actions' },
  { name: 'ArrowDownOnSquare', component: HeroIcons.ArrowDownOnSquareIcon, category: 'Actions' },
  { name: 'ArrowUpOnSquare', component: HeroIcons.ArrowUpOnSquareIcon, category: 'Actions' },
  { name: 'ArrowDownOnSquareStack', component: HeroIcons.ArrowDownOnSquareStackIcon, category: 'Actions' },
  { name: 'ArrowUpOnSquareStack', component: HeroIcons.ArrowUpOnSquareStackIcon, category: 'Actions' },
  { name: 'CloudArrowUp', component: HeroIcons.CloudArrowUpIcon, category: 'Actions' },
  { name: 'CloudArrowDown', component: HeroIcons.CloudArrowDownIcon, category: 'Actions' },
  { name: 'PaperAirplane', component: HeroIcons.PaperAirplaneIcon, category: 'Actions' },
  { name: 'PaperClip', component: HeroIcons.PaperClipIcon, category: 'Actions' },
  { name: 'Printer', component: HeroIcons.PrinterIcon, category: 'Actions' },
  { name: 'Scissors', component: HeroIcons.ScissorsIcon, category: 'Actions' },
  { name: 'Power', component: HeroIcons.PowerIcon, category: 'Actions' },
  { name: 'Backspace', component: HeroIcons.BackspaceIcon, category: 'Actions' },

  // Development (code, terminal, bug, etc.)
  { name: 'CodeBracket', component: HeroIcons.CodeBracketIcon, category: 'Development' },
  { name: 'CodeBracketSquare', component: HeroIcons.CodeBracketSquareIcon, category: 'Development' },
  { name: 'CommandLine', component: HeroIcons.CommandLineIcon, category: 'Development' },
  { name: 'BugAnt', component: HeroIcons.BugAntIcon, category: 'Development' },
  { name: 'Server', component: HeroIcons.ServerIcon, category: 'Development' },
  { name: 'ServerStack', component: HeroIcons.ServerStackIcon, category: 'Development' },
  { name: 'CircleStack', component: HeroIcons.CircleStackIcon, category: 'Development' },
  { name: 'Cube', component: HeroIcons.CubeIcon, category: 'Development' },
  { name: 'CubeTransparent', component: HeroIcons.CubeTransparentIcon, category: 'Development' },
  { name: 'Cloud', component: HeroIcons.CloudIcon, category: 'Development' },
  { name: 'Cog', component: HeroIcons.CogIcon, category: 'Development' },
  { name: 'Cog6Tooth', component: HeroIcons.Cog6ToothIcon, category: 'Development' },
  { name: 'Cog8Tooth', component: HeroIcons.Cog8ToothIcon, category: 'Development' },
  { name: 'CpuChip', component: HeroIcons.CpuChipIcon, category: 'Development' },
  { name: 'ComputerDesktop', component: HeroIcons.ComputerDesktopIcon, category: 'Development' },
  { name: 'Window', component: HeroIcons.WindowIcon, category: 'Development' },
  { name: 'Variable', component: HeroIcons.VariableIcon, category: 'Development' },
  { name: 'QrCode', component: HeroIcons.QrCodeIcon, category: 'Development' },
  { name: 'Wrench', component: HeroIcons.WrenchIcon, category: 'Development' },
  { name: 'WrenchScrewdriver', component: HeroIcons.WrenchScrewdriverIcon, category: 'Development' },

  // Social (chat, users, communication)
  { name: 'ChatBubbleBottomCenter', component: HeroIcons.ChatBubbleBottomCenterIcon, category: 'Social' },
  { name: 'ChatBubbleBottomCenterText', component: HeroIcons.ChatBubbleBottomCenterTextIcon, category: 'Social' },
  { name: 'ChatBubbleLeft', component: HeroIcons.ChatBubbleLeftIcon, category: 'Social' },
  { name: 'ChatBubbleLeftEllipsis', component: HeroIcons.ChatBubbleLeftEllipsisIcon, category: 'Social' },
  { name: 'ChatBubbleLeftRight', component: HeroIcons.ChatBubbleLeftRightIcon, category: 'Social' },
  { name: 'ChatBubbleOvalLeft', component: HeroIcons.ChatBubbleOvalLeftIcon, category: 'Social' },
  { name: 'ChatBubbleOvalLeftEllipsis', component: HeroIcons.ChatBubbleOvalLeftEllipsisIcon, category: 'Social' },
  { name: 'Envelope', component: HeroIcons.EnvelopeIcon, category: 'Social' },
  { name: 'EnvelopeOpen', component: HeroIcons.EnvelopeOpenIcon, category: 'Social' },
  { name: 'Phone', component: HeroIcons.PhoneIcon, category: 'Social' },
  { name: 'PhoneArrowDownLeft', component: HeroIcons.PhoneArrowDownLeftIcon, category: 'Social' },
  { name: 'PhoneArrowUpRight', component: HeroIcons.PhoneArrowUpRightIcon, category: 'Social' },
  { name: 'PhoneXMark', component: HeroIcons.PhoneXMarkIcon, category: 'Social' },
  { name: 'User', component: HeroIcons.UserIcon, category: 'Social' },
  { name: 'UserCircle', component: HeroIcons.UserCircleIcon, category: 'Social' },
  { name: 'UserGroup', component: HeroIcons.UserGroupIcon, category: 'Social' },
  { name: 'UserMinus', component: HeroIcons.UserMinusIcon, category: 'Social' },
  { name: 'UserPlus', component: HeroIcons.UserPlusIcon, category: 'Social' },
  { name: 'Users', component: HeroIcons.UsersIcon, category: 'Social' },
  { name: 'AtSymbol', component: HeroIcons.AtSymbolIcon, category: 'Social' },
  { name: 'Hashtag', component: HeroIcons.HashtagIcon, category: 'Social' },
  { name: 'HandRaised', component: HeroIcons.HandRaisedIcon, category: 'Social' },
  { name: 'HandThumbUp', component: HeroIcons.HandThumbUpIcon, category: 'Social' },
  { name: 'HandThumbDown', component: HeroIcons.HandThumbDownIcon, category: 'Social' },
  { name: 'Megaphone', component: HeroIcons.MegaphoneIcon, category: 'Social' },
  { name: 'Rss', component: HeroIcons.RssIcon, category: 'Social' },

  // Media (photo, video, music, etc.)
  { name: 'Photo', component: HeroIcons.PhotoIcon, category: 'Media' },
  { name: 'VideoCamera', component: HeroIcons.VideoCameraIcon, category: 'Media' },
  { name: 'VideoCameraSlash', component: HeroIcons.VideoCameraSlashIcon, category: 'Media' },
  { name: 'Camera', component: HeroIcons.CameraIcon, category: 'Media' },
  { name: 'Film', component: HeroIcons.FilmIcon, category: 'Media' },
  { name: 'Tv', component: HeroIcons.TvIcon, category: 'Media' },
  { name: 'MusicalNote', component: HeroIcons.MusicalNoteIcon, category: 'Media' },
  { name: 'Microphone', component: HeroIcons.MicrophoneIcon, category: 'Media' },
  { name: 'SpeakerWave', component: HeroIcons.SpeakerWaveIcon, category: 'Media' },
  { name: 'SpeakerXMark', component: HeroIcons.SpeakerXMarkIcon, category: 'Media' },
  { name: 'Radio', component: HeroIcons.RadioIcon, category: 'Media' },
  { name: 'Signal', component: HeroIcons.SignalIcon, category: 'Media' },
  { name: 'SignalSlash', component: HeroIcons.SignalSlashIcon, category: 'Media' },
  { name: 'Gif', component: HeroIcons.GifIcon, category: 'Media' },
  { name: 'EyeDropper', component: HeroIcons.EyeDropperIcon, category: 'Media' },
  { name: 'PaintBrush', component: HeroIcons.PaintBrushIcon, category: 'Media' },
  { name: 'Swatch', component: HeroIcons.SwatchIcon, category: 'Media' },

  // Files (document, folder, archive, etc.)
  { name: 'Document', component: HeroIcons.DocumentIcon, category: 'Files' },
  { name: 'DocumentText', component: HeroIcons.DocumentTextIcon, category: 'Files' },
  { name: 'DocumentArrowDown', component: HeroIcons.DocumentArrowDownIcon, category: 'Files' },
  { name: 'DocumentArrowUp', component: HeroIcons.DocumentArrowUpIcon, category: 'Files' },
  { name: 'DocumentChartBar', component: HeroIcons.DocumentChartBarIcon, category: 'Files' },
  { name: 'DocumentCheck', component: HeroIcons.DocumentCheckIcon, category: 'Files' },
  { name: 'DocumentDuplicate', component: HeroIcons.DocumentDuplicateIcon, category: 'Files' },
  { name: 'DocumentMagnifyingGlass', component: HeroIcons.DocumentMagnifyingGlassIcon, category: 'Files' },
  { name: 'DocumentMinus', component: HeroIcons.DocumentMinusIcon, category: 'Files' },
  { name: 'DocumentPlus', component: HeroIcons.DocumentPlusIcon, category: 'Files' },
  { name: 'DocumentCurrencyBangladeshi', component: HeroIcons.DocumentCurrencyBangladeshiIcon, category: 'Files' },
  { name: 'DocumentCurrencyDollar', component: HeroIcons.DocumentCurrencyDollarIcon, category: 'Files' },
  { name: 'DocumentCurrencyEuro', component: HeroIcons.DocumentCurrencyEuroIcon, category: 'Files' },
  { name: 'DocumentCurrencyPound', component: HeroIcons.DocumentCurrencyPoundIcon, category: 'Files' },
  { name: 'DocumentCurrencyRupee', component: HeroIcons.DocumentCurrencyRupeeIcon, category: 'Files' },
  { name: 'DocumentCurrencyYen', component: HeroIcons.DocumentCurrencyYenIcon, category: 'Files' },
  { name: 'Folder', component: HeroIcons.FolderIcon, category: 'Files' },
  { name: 'FolderOpen', component: HeroIcons.FolderOpenIcon, category: 'Files' },
  { name: 'FolderPlus', component: HeroIcons.FolderPlusIcon, category: 'Files' },
  { name: 'FolderMinus', component: HeroIcons.FolderMinusIcon, category: 'Files' },
  { name: 'FolderArrowDown', component: HeroIcons.FolderArrowDownIcon, category: 'Files' },
  { name: 'ArchiveBox', component: HeroIcons.ArchiveBoxIcon, category: 'Files' },
  { name: 'ArchiveBoxArrowDown', component: HeroIcons.ArchiveBoxArrowDownIcon, category: 'Files' },
  { name: 'ArchiveBoxXMark', component: HeroIcons.ArchiveBoxXMarkIcon, category: 'Files' },
  { name: 'Clipboard', component: HeroIcons.ClipboardIcon, category: 'Files' },
  { name: 'ClipboardDocument', component: HeroIcons.ClipboardDocumentIcon, category: 'Files' },
  { name: 'ClipboardDocumentCheck', component: HeroIcons.ClipboardDocumentCheckIcon, category: 'Files' },
  { name: 'ClipboardDocumentList', component: HeroIcons.ClipboardDocumentListIcon, category: 'Files' },
  { name: 'Newspaper', component: HeroIcons.NewspaperIcon, category: 'Files' },
  { name: 'BookOpen', component: HeroIcons.BookOpenIcon, category: 'Files' },

  // Shopping (cart, currency, business)
  { name: 'ShoppingCart', component: HeroIcons.ShoppingCartIcon, category: 'Shopping' },
  { name: 'ShoppingBag', component: HeroIcons.ShoppingBagIcon, category: 'Shopping' },
  { name: 'CurrencyDollar', component: HeroIcons.CurrencyDollarIcon, category: 'Shopping' },
  { name: 'CurrencyEuro', component: HeroIcons.CurrencyEuroIcon, category: 'Shopping' },
  { name: 'CurrencyPound', component: HeroIcons.CurrencyPoundIcon, category: 'Shopping' },
  { name: 'CurrencyYen', component: HeroIcons.CurrencyYenIcon, category: 'Shopping' },
  { name: 'CurrencyRupee', component: HeroIcons.CurrencyRupeeIcon, category: 'Shopping' },
  { name: 'CurrencyBangladeshi', component: HeroIcons.CurrencyBangladeshiIcon, category: 'Shopping' },
  { name: 'CreditCard', component: HeroIcons.CreditCardIcon, category: 'Shopping' },
  { name: 'Wallet', component: HeroIcons.WalletIcon, category: 'Shopping' },
  { name: 'Banknotes', component: HeroIcons.BanknotesIcon, category: 'Shopping' },
  { name: 'ReceiptPercent', component: HeroIcons.ReceiptPercentIcon, category: 'Shopping' },
  { name: 'ReceiptRefund', component: HeroIcons.ReceiptRefundIcon, category: 'Shopping' },
  { name: 'Ticket', component: HeroIcons.TicketIcon, category: 'Shopping' },
  { name: 'Tag', component: HeroIcons.TagIcon, category: 'Shopping' },
  { name: 'PercentBadge', component: HeroIcons.PercentBadgeIcon, category: 'Shopping' },
  { name: 'BuildingStorefront', component: HeroIcons.BuildingStorefrontIcon, category: 'Shopping' },
  { name: 'Gift', component: HeroIcons.GiftIcon, category: 'Shopping' },
  { name: 'GiftTop', component: HeroIcons.GiftTopIcon, category: 'Shopping' },

  // Weather (sun, moon, cloud)
  { name: 'Sun', component: HeroIcons.SunIcon, category: 'Weather' },
  { name: 'Moon', component: HeroIcons.MoonIcon, category: 'Weather' },

  // Interface (settings, adjustments, UI elements)
  { name: 'AdjustmentsHorizontal', component: HeroIcons.AdjustmentsHorizontalIcon, category: 'Interface' },
  { name: 'AdjustmentsVertical', component: HeroIcons.AdjustmentsVerticalIcon, category: 'Interface' },
  { name: 'Bars2', component: HeroIcons.Bars2Icon, category: 'Interface' },
  { name: 'Bars3', component: HeroIcons.Bars3Icon, category: 'Interface' },
  { name: 'Bars3BottomLeft', component: HeroIcons.Bars3BottomLeftIcon, category: 'Interface' },
  { name: 'Bars3BottomRight', component: HeroIcons.Bars3BottomRightIcon, category: 'Interface' },
  { name: 'Bars3CenterLeft', component: HeroIcons.Bars3CenterLeftIcon, category: 'Interface' },
  { name: 'Bars4', component: HeroIcons.Bars4Icon, category: 'Interface' },
  { name: 'BarsArrowDown', component: HeroIcons.BarsArrowDownIcon, category: 'Interface' },
  { name: 'BarsArrowUp', component: HeroIcons.BarsArrowUpIcon, category: 'Interface' },
  { name: 'EllipsisHorizontal', component: HeroIcons.EllipsisHorizontalIcon, category: 'Interface' },
  { name: 'EllipsisHorizontalCircle', component: HeroIcons.EllipsisHorizontalCircleIcon, category: 'Interface' },
  { name: 'EllipsisVertical', component: HeroIcons.EllipsisVerticalIcon, category: 'Interface' },
  { name: 'QueueList', component: HeroIcons.QueueListIcon, category: 'Interface' },
  { name: 'ListBullet', component: HeroIcons.ListBulletIcon, category: 'Interface' },
  { name: 'NumberedList', component: HeroIcons.NumberedListIcon, category: 'Interface' },
  { name: 'ViewColumns', component: HeroIcons.ViewColumnsIcon, category: 'Interface' },
  { name: 'TableCells', component: HeroIcons.TableCellsIcon, category: 'Interface' },
  { name: 'Funnel', component: HeroIcons.FunnelIcon, category: 'Interface' },
  { name: 'MagnifyingGlassCircle', component: HeroIcons.MagnifyingGlassCircleIcon, category: 'Interface' },
  { name: 'MagnifyingGlassPlus', component: HeroIcons.MagnifyingGlassPlusIcon, category: 'Interface' },
  { name: 'MagnifyingGlassMinus', component: HeroIcons.MagnifyingGlassMinusIcon, category: 'Interface' },
  { name: 'Eye', component: HeroIcons.EyeIcon, category: 'Interface' },
  { name: 'EyeSlash', component: HeroIcons.EyeSlashIcon, category: 'Interface' },
  { name: 'InformationCircle', component: HeroIcons.InformationCircleIcon, category: 'Interface' },
  { name: 'QuestionMarkCircle', component: HeroIcons.QuestionMarkCircleIcon, category: 'Interface' },
  { name: 'ExclamationCircle', component: HeroIcons.ExclamationCircleIcon, category: 'Interface' },
  { name: 'ExclamationTriangle', component: HeroIcons.ExclamationTriangleIcon, category: 'Interface' },
  { name: 'NoSymbol', component: HeroIcons.NoSymbolIcon, category: 'Interface' },
  { name: 'Inbox', component: HeroIcons.InboxIcon, category: 'Interface' },
  { name: 'InboxArrowDown', component: HeroIcons.InboxArrowDownIcon, category: 'Interface' },
  { name: 'InboxStack', component: HeroIcons.InboxStackIcon, category: 'Interface' },
  { name: 'ViewfinderCircle', component: HeroIcons.ViewfinderCircleIcon, category: 'Interface' },
  { name: 'Wifi', component: HeroIcons.WifiIcon, category: 'Interface' },
  { name: 'CursorArrowRays', component: HeroIcons.CursorArrowRaysIcon, category: 'Interface' },
  { name: 'CursorArrowRipple', component: HeroIcons.CursorArrowRippleIcon, category: 'Interface' },

  // Shapes (squares, circles, geometric shapes)
  { name: 'Square2Stack', component: HeroIcons.Square2StackIcon, category: 'Shapes' },
  { name: 'Square3Stack3D', component: HeroIcons.Square3Stack3DIcon, category: 'Shapes' },
  { name: 'Squares2X2', component: HeroIcons.Squares2X2Icon, category: 'Shapes' },
  { name: 'SquaresPlus', component: HeroIcons.SquaresPlusIcon, category: 'Shapes' },
  { name: 'RectangleGroup', component: HeroIcons.RectangleGroupIcon, category: 'Shapes' },
  { name: 'RectangleStack', component: HeroIcons.RectangleStackIcon, category: 'Shapes' },

  // Text Formatting (bold, italic, etc.)
  { name: 'Bold', component: HeroIcons.BoldIcon, category: 'Text Formatting' },
  { name: 'Italic', component: HeroIcons.ItalicIcon, category: 'Text Formatting' },
  { name: 'Underline', component: HeroIcons.UnderlineIcon, category: 'Text Formatting' },
  { name: 'Strikethrough', component: HeroIcons.StrikethroughIcon, category: 'Text Formatting' },
  { name: 'H1', component: HeroIcons.H1Icon, category: 'Text Formatting' },
  { name: 'H2', component: HeroIcons.H2Icon, category: 'Text Formatting' },
  { name: 'H3', component: HeroIcons.H3Icon, category: 'Text Formatting' },
  { name: 'Link', component: HeroIcons.LinkIcon, category: 'Text Formatting' },
  { name: 'LinkSlash', component: HeroIcons.LinkSlashIcon, category: 'Text Formatting' },
  { name: 'Language', component: HeroIcons.LanguageIcon, category: 'Text Formatting' },

  // Charts & Analytics (graphs, charts, presentations)
  { name: 'ChartBar', component: HeroIcons.ChartBarIcon, category: 'Charts & Analytics' },
  { name: 'ChartBarSquare', component: HeroIcons.ChartBarSquareIcon, category: 'Charts & Analytics' },
  { name: 'ChartPie', component: HeroIcons.ChartPieIcon, category: 'Charts & Analytics' },
  { name: 'PresentationChartBar', component: HeroIcons.PresentationChartBarIcon, category: 'Charts & Analytics' },
  { name: 'PresentationChartLine', component: HeroIcons.PresentationChartLineIcon, category: 'Charts & Analytics' },

  // Security (lock, key, shield, etc.)
  { name: 'LockClosed', component: HeroIcons.LockClosedIcon, category: 'Security' },
  { name: 'LockOpen', component: HeroIcons.LockOpenIcon, category: 'Security' },
  { name: 'Key', component: HeroIcons.KeyIcon, category: 'Security' },
  { name: 'ShieldCheck', component: HeroIcons.ShieldCheckIcon, category: 'Security' },
  { name: 'ShieldExclamation', component: HeroIcons.ShieldExclamationIcon, category: 'Security' },
  { name: 'FingerPrint', component: HeroIcons.FingerPrintIcon, category: 'Security' },
  { name: 'Identification', component: HeroIcons.IdentificationIcon, category: 'Security' },

  // Location & Travel (map, pin, globe, etc.)
  { name: 'Map', component: HeroIcons.MapIcon, category: 'Location & Travel' },
  { name: 'MapPin', component: HeroIcons.MapPinIcon, category: 'Location & Travel' },
  { name: 'GlobeAlt', component: HeroIcons.GlobeAltIcon, category: 'Location & Travel' },
  { name: 'GlobeAmericas', component: HeroIcons.GlobeAmericasIcon, category: 'Location & Travel' },
  { name: 'GlobeAsiaAustralia', component: HeroIcons.GlobeAsiaAustraliaIcon, category: 'Location & Travel' },
  { name: 'GlobeEuropeAfrica', component: HeroIcons.GlobeEuropeAfricaIcon, category: 'Location & Travel' },
  { name: 'Truck', component: HeroIcons.TruckIcon, category: 'Location & Travel' },
  { name: 'RocketLaunch', component: HeroIcons.RocketLaunchIcon, category: 'Location & Travel' },

  // Business & Office (briefcase, building, calendar, etc.)
  { name: 'Briefcase', component: HeroIcons.BriefcaseIcon, category: 'Business & Office' },
  { name: 'BuildingOffice', component: HeroIcons.BuildingOfficeIcon, category: 'Business & Office' },
  { name: 'BuildingOffice2', component: HeroIcons.BuildingOffice2Icon, category: 'Business & Office' },
  { name: 'BuildingLibrary', component: HeroIcons.BuildingLibraryIcon, category: 'Business & Office' },
  { name: 'HomeModern', component: HeroIcons.HomeModernIcon, category: 'Business & Office' },
  { name: 'Calendar', component: HeroIcons.CalendarIcon, category: 'Business & Office' },
  { name: 'CalendarDays', component: HeroIcons.CalendarDaysIcon, category: 'Business & Office' },
  { name: 'CalendarDateRange', component: HeroIcons.CalendarDateRangeIcon, category: 'Business & Office' },
  { name: 'Clock', component: HeroIcons.ClockIcon, category: 'Business & Office' },
  { name: 'Calculator', component: HeroIcons.CalculatorIcon, category: 'Business & Office' },
  { name: 'Scale', component: HeroIcons.ScaleIcon, category: 'Business & Office' },

  // Education (academic cap, book, beaker, etc.)
  { name: 'AcademicCap', component: HeroIcons.AcademicCapIcon, category: 'Education' },
  { name: 'Beaker', component: HeroIcons.BeakerIcon, category: 'Education' },
  { name: 'LightBulb', component: HeroIcons.LightBulbIcon, category: 'Education' },

  // Devices (phone, tablet, desktop)
  { name: 'DevicePhoneMobile', component: HeroIcons.DevicePhoneMobileIcon, category: 'Devices' },
  { name: 'DeviceTablet', component: HeroIcons.DeviceTabletIcon, category: 'Devices' },

  // Math & Symbols (plus, minus, equals, etc.)
  { name: 'Equals', component: HeroIcons.EqualsIcon, category: 'Math & Symbols' },
  { name: 'Divide', component: HeroIcons.DivideIcon, category: 'Math & Symbols' },
  { name: 'Slash', component: HeroIcons.SlashIcon, category: 'Math & Symbols' },

  // Miscellaneous (everything else)
  { name: 'Trophy', component: HeroIcons.TrophyIcon, category: 'Miscellaneous' },
  { name: 'PuzzlePiece', component: HeroIcons.PuzzlePieceIcon, category: 'Miscellaneous' },
  { name: 'Bolt', component: HeroIcons.BoltIcon, category: 'Miscellaneous' },
  { name: 'BoltSlash', component: HeroIcons.BoltSlashIcon, category: 'Miscellaneous' },
  { name: 'Lifebuoy', component: HeroIcons.LifebuoyIcon, category: 'Miscellaneous' },
  { name: 'Cake', component: HeroIcons.CakeIcon, category: 'Miscellaneous' },
  { name: 'FaceFrown', component: HeroIcons.FaceFrownIcon, category: 'Miscellaneous' },
  { name: 'FaceSmile', component: HeroIcons.FaceSmileIcon, category: 'Miscellaneous' },
  { name: 'Battery0', component: HeroIcons.Battery0Icon, category: 'Miscellaneous' },
  { name: 'Battery50', component: HeroIcons.Battery50Icon, category: 'Miscellaneous' },
  { name: 'Battery100', component: HeroIcons.Battery100Icon, category: 'Miscellaneous' },
  { name: 'ArrowLeftEndOnRectangle', component: HeroIcons.ArrowLeftEndOnRectangleIcon, category: 'Miscellaneous' },
  { name: 'ArrowLeftOnRectangle', component: HeroIcons.ArrowLeftOnRectangleIcon, category: 'Miscellaneous' },
  { name: 'ArrowLeftStartOnRectangle', component: HeroIcons.ArrowLeftStartOnRectangleIcon, category: 'Miscellaneous' },
  { name: 'ArrowRightEndOnRectangle', component: HeroIcons.ArrowRightEndOnRectangleIcon, category: 'Miscellaneous' },
  { name: 'ArrowRightOnRectangle', component: HeroIcons.ArrowRightOnRectangleIcon, category: 'Miscellaneous' },
  { name: 'ArrowRightStartOnRectangle', component: HeroIcons.ArrowRightStartOnRectangleIcon, category: 'Miscellaneous' },

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
