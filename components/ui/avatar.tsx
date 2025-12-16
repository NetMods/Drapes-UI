
interface AvatarProps {
  url: string,
  className?: string
}



const Avatar = ({
  url,
  className,
}: AvatarProps) => {
  return (
    <img className={className} src={url} alt="UserImage" />
  )
}

export default Avatar
