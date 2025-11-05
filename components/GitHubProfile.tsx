'use client';

import { useEffect, useState } from 'react';
import { Github, MapPin, Users, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  followers: number;
  public_repos: number;
  html_url: string;
  blog: string | null;
}

export function GitHubProfile({ username }: { username: string }) {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Error fetching GitHub profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card/80 p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card/80 p-6 hover:bg-card transition-colors"
    >
      <a
        href={user.html_url}
        target="_blank"
        rel="noreferrer"
        className="flex flex-col md:flex-row items-start md:items-center gap-4 group"
      >
        <img
          src={user.avatar_url}
          alt={user.name || user.login}
          className="h-16 w-16 rounded-full border-2 border-border group-hover:border-primary transition-colors"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {user.name || user.login}
            </h3>
            <Github className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">@{user.login}</p>
          {user.bio && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{user.bio}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {user.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{user.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{user.followers} seguidores</span>
            </div>
            <div className="flex items-center gap-1">
              <Github className="h-3 w-3" />
              <span>{user.public_repos} repositórios</span>
            </div>
            {user.blog && (
              <a
                href={user.blog}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <LinkIcon className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{user.blog}</span>
              </a>
            )}
          </div>
        </div>
      </a>
    </motion.div>
  );
}
