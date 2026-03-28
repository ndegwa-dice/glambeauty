import { useState, useRef } from "react";
import { Camera, MapPin, Instagram, Star, Users, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StylistAvailabilityToggle } from "./StylistAvailabilityToggle";
import type { StylistProfile } from "@/hooks/useStylistProfile";
import type { Database } from "@/integrations/supabase/types";

type AvailabilityStatus = Database["public"]["Enums"]["availability_status"];

interface StylistProfileHeaderProps {
  profile: StylistProfile;
  isOwner?: boolean;
  onAvatarUpload?: (file: File) => Promise<string | null>;
  onCoverUpload?: (file: File) => Promise<string | null>;
  onAvailabilityChange?: (status: AvailabilityStatus) => Promise<boolean>;
}

export function StylistProfileHeader({
  profile,
  isOwner = false,
  onAvatarUpload,
  onCoverUpload,
  onAvailabilityChange,
}: StylistProfileHeaderProps) {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAvatarUpload) return;

    setIsUploadingAvatar(true);
    await onAvatarUpload(file);
    setIsUploadingAvatar(false);
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onCoverUpload) return;

    setIsUploadingCover(true);
    await onCoverUpload(file);
    setIsUploadingCover(false);
  };

  const availabilityColors: Record<AvailabilityStatus, string> = {
    available: "bg-success",
    busy: "bg-warning",
    away: "bg-muted-foreground",
  };

  return (
    <div className="relative">
      {/* Cover Photo */}
      <div className="relative h-40 w-full overflow-hidden rounded-t-xl">
        {profile.cover_image_url ? (
          <img
            src={profile.cover_image_url}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/10" />
        )}
        
        {/* Cover overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        
        {/* Edit cover button */}
        {isOwner && (
          <>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-3 right-3 gap-1.5 bg-background/80 backdrop-blur-sm"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploadingCover}
            >
              <Camera className="w-4 h-4" />
              {isUploadingCover ? "Uploading..." : "Edit Cover"}
            </Button>
          </>
        )}
      </div>

      {/* Profile Info Section */}
      <div className="relative px-4 pb-4">
        {/* Avatar */}
        <div className="absolute -top-12 left-4">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full ${availabilityColors[profile.availability_status]} blur-md opacity-50 animate-pulse`} />
            <Avatar className="w-24 h-24 border-4 border-background shadow-xl relative">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-2xl font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Availability indicator dot */}
            <div 
              className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-background ${availabilityColors[profile.availability_status]}`}
            />

            {/* Edit avatar button */}
            {isOwner && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background/90 shadow-md"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Name and Availability Toggle */}
        <div className="pt-14 flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {profile.name}
            </h1>
            {profile.specialty && (
              <Badge variant="secondary" className="text-xs">
                {profile.specialty}
              </Badge>
            )}
          </div>
          
          {isOwner && onAvailabilityChange && (
            <StylistAvailabilityToggle
              status={profile.availability_status}
              onStatusChange={onAvailabilityChange}
            />
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* Meta info row */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {profile.salon_name && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{profile.salon_name}</span>
            </div>
          )}
          {profile.instagram_handle && (
            <a
              href={`https://instagram.com/${profile.instagram_handle.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Instagram className="w-4 h-4" />
              <span>{profile.instagram_handle}</span>
            </a>
          )}
        </div>

        {/* Stats Bar */}
        <div className="mt-4 flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 text-warning">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-semibold text-foreground">
                {profile.rating_avg.toFixed(1)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({profile.rating_count})
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">
              {profile.followers_count}
            </span>
            <span className="text-xs text-muted-foreground">followers</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-secondary" />
            <span className="font-semibold text-foreground">
              {profile.total_clients_served}
            </span>
            <span className="text-xs text-muted-foreground">clients</span>
          </div>
        </div>
      </div>
    </div>
  );
}
