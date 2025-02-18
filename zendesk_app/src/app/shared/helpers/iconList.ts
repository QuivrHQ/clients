import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { BiCode, BiCoin } from 'react-icons/bi'
import {
  BsArrowRightShort,
  BsFiletypeDocx,
  BsFiletypeHtml,
  BsFiletypeMd,
  BsFiletypePy,
  BsFiletypeTxt,
  BsTextParagraph
} from 'react-icons/bs'
import { CgSoftwareDownload } from 'react-icons/cg'
import { CiFlag1 } from 'react-icons/ci'
import {
  FaCalendar,
  FaCheck,
  FaCheckCircle,
  FaDiscord,
  FaFile,
  FaFileAlt,
  FaFileCsv,
  FaGithub,
  FaLinkedin,
  FaQuestionCircle,
  FaRegFileAlt,
  FaRegFileAudio,
  FaRegFileExcel,
  FaRegFilePdf,
  FaRegFolder,
  FaRegKeyboard,
  FaRegStar,
  FaRegThumbsDown,
  FaRegThumbsUp,
  FaRegUserCircle,
  FaSort,
  FaTwitter,
  FaUnlock
} from 'react-icons/fa'
import { FaInfo, FaRegFilePowerpoint, FaRegFileWord } from 'react-icons/fa6'
import { FiUpload } from 'react-icons/fi'
import { GoLightBulb, GoTable } from 'react-icons/go'
import { HiBuildingOffice } from 'react-icons/hi2'
import {
  IoIosAdd,
  IoIosRadio,
  IoIosSend,
  IoMdClose,
  IoMdLogOut,
  IoMdSend,
  IoMdSettings,
  IoMdSync
} from 'react-icons/io'
import {
  IoArrowDown,
  IoArrowUpCircleOutline,
  IoBookOutline,
  IoCameraOutline,
  IoChatbubbleEllipsesOutline,
  IoCloudDownloadOutline,
  IoFootsteps,
  IoHelp,
  IoHomeOutline,
  IoMusicalNote,
  IoShareSocial,
  IoWarningOutline
} from 'react-icons/io5'
import { LiaFileVideo, LiaRobotSolid } from 'react-icons/lia'
import { IconType } from 'react-icons/lib'
import {
  LuArrowLeftFromLine,
  LuBook,
  LuBrain,
  LuBrainCircuit,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuCopy,
  LuExternalLink,
  LuGoal,
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuHeading4,
  LuHeading5,
  LuHeading6,
  LuPen,
  LuPresentation,
  LuSearch
} from 'react-icons/lu'
import {
  MdDarkMode,
  MdDashboardCustomize,
  MdDynamicFeed,
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdHistory,
  MdLink,
  MdLoop,
  MdMarkEmailRead,
  MdMarkEmailUnread,
  MdOutlineEmojiEmotions,
  MdOutlineLightMode,
  MdOutlineMail,
  MdOutlineModeEditOutline,
  MdOutlinePalette,
  MdOutlineVpnKey,
  MdStrikethroughS,
  MdUnfoldLess,
  MdUnfoldMore,
  MdUploadFile
} from 'react-icons/md'
import { PiCodeBlock, PiOfficeChairFill } from 'react-icons/pi'
import { RiDeleteBackLine, RiDeleteBin6Line, RiHashtag, RiNotification2Line } from 'react-icons/ri'
import { SlOptionsVertical } from 'react-icons/sl'
import { TbNetwork, TbProgress, TbRobot } from 'react-icons/tb'
import { VscGraph } from 'react-icons/vsc'

export const iconList: { [name: string]: IconType } = {
  addWithoutCircle: IoIosAdd,
  arrowDown: IoArrowDown,
  assistant: TbRobot,
  back: RiDeleteBackLine,
  bib: FaFile,
  blockquote: MdFormatQuote,
  bold: MdFormatBold,
  brain: LuBrain,
  brainCircuit: LuBrainCircuit,
  calendar: FaCalendar,
  chair: PiOfficeChairFill,
  chat: IoChatbubbleEllipsesOutline,
  check: FaCheck,
  checkCircle: FaCheckCircle,
  chevronDown: LuChevronDown,
  chevronLeft: LuChevronLeft,
  chevronRight: LuChevronRight,
  close: IoMdClose,
  code: BiCode,
  codeblock: PiCodeBlock,
  coin: BiCoin,
  color: MdOutlinePalette,
  copy: LuCopy,
  csv: FaFileCsv,
  custom: MdDashboardCustomize,
  delete: RiDeleteBin6Line,
  discord: FaDiscord,
  doc: FaRegFileAlt,
  docx: FaRegFileWord,
  download: IoCloudDownloadOutline,
  edit: MdOutlineModeEditOutline,
  email: MdOutlineMail,
  emoji: MdOutlineEmojiEmotions,
  epub: FaFile,
  eureka: GoLightBulb,
  externLink: LuExternalLink,
  feed: MdDynamicFeed,
  file: FaRegFileAlt,
  fileSelected: FaFileAlt,
  flag: CiFlag1,
  fold: MdUnfoldLess,
  folder: FaRegFolder,
  followUp: IoArrowUpCircleOutline,
  github: FaGithub,
  goal: LuGoal,
  graph: VscGraph,
  hashtag: RiHashtag,
  heading1: LuHeading1,
  heading2: LuHeading2,
  heading3: LuHeading3,
  heading4: LuHeading4,
  heading5: LuHeading5,
  heading6: LuHeading6,
  help: IoHelp,
  hide: LuArrowLeftFromLine,
  history: MdHistory,
  home: IoHomeOutline,
  html: BsFiletypeHtml,
  info: FaInfo,
  invite: IoIosSend,
  ipynb: BsFiletypePy,
  italic: MdFormatItalic,
  jpg: IoCameraOutline,
  key: MdOutlineVpnKey,
  knowledge: LuBook,
  link: MdLink,
  linkedin: FaLinkedin,
  loader: AiOutlineLoading3Quarters,
  logout: IoMdLogOut,
  m4a: LiaFileVideo,
  markdown: BsFiletypeMd,
  md: BsFiletypeMd,
  moon: MdDarkMode,
  mp3: IoMusicalNote,
  mp4: IoMusicalNote,
  mpga: FaRegFileAudio,
  mpeg: LiaFileVideo,
  notifications: RiNotification2Line,
  office: HiBuildingOffice,
  odt: BsFiletypeDocx,
  orderedList: MdFormatListNumbered,
  options: SlOptionsVertical,
  paragraph: BsTextParagraph,
  pen: LuPen,
  png: IoCameraOutline,
  pdf: FaRegFilePdf,
  ppt: LuPresentation,
  pptx: FaRegFilePowerpoint,
  prompt: FaRegKeyboard,
  py: BsFiletypePy,
  question: FaQuestionCircle,
  radio: IoIosRadio,
  read: MdMarkEmailRead,
  redirection: BsArrowRightShort,
  regenerate: MdLoop,
  robot: LiaRobotSolid,
  search: LuSearch,
  send: IoMdSend,
  settings: IoMdSettings,
  share: IoShareSocial,
  software: CgSoftwareDownload,
  sort: FaSort,
  sources: IoBookOutline,
  star: FaRegStar,
  step: IoFootsteps,
  strikethrough: MdStrikethroughS,
  sun: MdOutlineLightMode,
  sync: IoMdSync,
  telegram: BsFiletypeDocx,
  thumbsDown: FaRegThumbsDown,
  thumbsUp: FaRegThumbsUp,
  twitter: FaTwitter,
  txt: BsFiletypeTxt,
  unfold: MdUnfoldMore,
  unlock: FaUnlock,
  unread: MdMarkEmailUnread,
  upload: FiUpload,
  uploadFile: MdUploadFile,
  unorderedList: MdFormatListBulleted,
  user: FaRegUserCircle,
  waiting: TbProgress,
  warning: IoWarningOutline,
  wav: FaRegFileAudio,
  webm: LiaFileVideo,
  website: TbNetwork,
  xls: GoTable,
  xlsx: FaRegFileExcel
}
