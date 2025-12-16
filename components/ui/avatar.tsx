import Image from "next/image"

interface AvatarProps {
  url: string,
  width: number,
  height: number,
  className?: string
}



const Avatar = ({
  url,
  width,
  height,
  className,
}: AvatarProps) => {
  return (
    <Image className={className} src={url} alt="UserImage" width={width} height={height} />
  )
}

export default Avatar
