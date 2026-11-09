import React from 'react';
import './watch-it-video.css';

export default function WatchItVideo({ resource }) {
  return <div className="watch-it-content">
    <p>{resource.description}</p>
    <video className="watch-it-video" src={resource.mediaUrl} controls playsInline preload="metadata" aria-label={`Watch It: ${resource.title}`}>
      <a href={resource.url} target="_blank" rel="noreferrer">Open video in a new window</a>
    </video>
    <div className="watch-it-links">
      <a href={resource.url} target="_blank" rel="noreferrer">Open video in a new window</a>
      {resource.transcriptUrl && <a href={resource.transcriptUrl} target="_blank" rel="noreferrer" aria-label="View transcript (opens in a new tab)">View transcript</a>}
    </div>
  </div>;
}
