import { useEffect, useRef, useState } from 'react';
import { UploadIcon, XIcon } from "@phosphor-icons/react";
import { Tooltip } from './tooltip';

interface MediaInputProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  mediaType: 'image' | 'video';
  defaultValue: string;
  description?: string;
  defaultImage?: string;
  defaultVideo?: string;
}

export const MediaInput = ({
  label,
  value,
  onChange,
  mediaType,
  defaultValue,
  description,
  defaultImage,
  defaultVideo
}: MediaInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const prevMediaTypeRef = useRef<'image' | 'video'>(mediaType);

  const effectiveValue = value !== undefined ? value : defaultValue;
  const isCustomFile = fileName !== null;

  // Cleanup object URL on unmount or when value changes
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  // Handle mediaType changes - switch to appropriate default if no custom file
  useEffect(() => {
    if (prevMediaTypeRef.current !== mediaType && !isCustomFile) {
      const newDefault = mediaType === 'image' ? defaultImage : defaultVideo;
      if (newDefault) {
        onChange(newDefault);
      }
    }
    prevMediaTypeRef.current = mediaType;
  }, [mediaType, isCustomFile, defaultImage, defaultVideo, onChange]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setFileName(file.name);
    onChange(objectUrl);
  };

  const handleClear = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setFileName(null);
    onChange(defaultValue);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const truncateFileName = (name: string, maxLength: number = 20): string => {
    if (name.length <= maxLength) return name;
    const extension = name.split('.').pop();
    const nameWithoutExt = name.slice(0, name.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.slice(0, maxLength - (extension?.length || 0) - 4);
    return `${truncatedName}...${extension}`;
  };

  const acceptedTypes = mediaType === 'image'
    ? 'image/*'
    : 'video/*';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between w-full font-mono">
        <label className="text-xs capitalize text-base-content/80 inline-flex justify-between items-center gap-1 group">
          {label}
          <Tooltip description={description || ""} />
        </label>

        <div className='flex gap-1'>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileSelect}
            className="hidden"
            aria-label={`Upload ${mediaType}`}
          />

          <button
            type="button"
            onClick={handleButtonClick}
            className="flex items-center justify-center gap-2 h-8 px-5.5 bg-base-100/10
                   border border-base-content/15 rounded-lg text-xs font-mono
                   text-base-content/70 hover:bg-base-content/20 hover:text-base-content
                   transition-colors"
          >
            <UploadIcon size={16} weight="bold" />
            {isCustomFile ? (
              <span className="truncate">{truncateFileName(fileName)}</span>
            ) : (
              <span>Upload {mediaType}</span>
            )}
          </button>

          {isCustomFile && (
            <button
              type="button"
              onClick={handleClear}
              className="size-8 flex items-center justify-center bg-base-100/10
                     border border-base-content/15 rounded-lg
                     text-base-content/60 hover:text-base-content hover:bg-base-content/20
                     transition-colors"
              aria-label="Clear uploaded file"
            >
              <XIcon size={16} weight="bold" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
