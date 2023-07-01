import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { formatDistanceToNow } from 'date-fns';
import { Outlet, Link } from 'react-router-dom';

import '../styles.css';

interface ArtItem {
  id: number;
  title: string | null;
  content: string;
  url: string | null;
  createdAt: string;
  updatedAt: string;
  artworkId: number;
}

interface PageItem {
  id: number;
  page_number: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  storyId: number;
}

interface Music {
  id: number; 
  songTitle: string;
  content: null;
  createdAt: string;
  updatedAt: string;
  artworkId: number;
}

type FeedItem = ArtItem | PageItem | Music;

const Feed: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [feedData, setFeedData] = useState<FeedItem[] | null>(null);
  const [pageData, setPageData] = useState<{ [key: number]: PageItem[] }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [artResponse, storyResponse, musicResponse] = await Promise.all([fetch('/visualart'), fetch('/api/stories'), fetch('/music')]);
        const [artData, storyData, musicData] = await Promise.all([artResponse.json(), storyResponse.json(), musicResponse.json()]);

        const combinedData: FeedItem[] = [...artData, ...storyData, ...musicData];
        const sortedData = combinedData.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setFeedData(sortedData);

       
        const pagePromises = storyData.map((story: any) => fetch(`http://localhost:8000/api/pages?storyId=${story.id}`));

        
        const pageResponses = await Promise.all(pagePromises);
        const pageData = await Promise.all(pageResponses.map(response => response.json()));

        const formattedPageData: { [key: number]: PageItem[] } = {};

        pageData.forEach((pages: PageItem[]) => {
          const storyId = pages[0]?.storyId;
          if (storyId) {
            formattedPageData[storyId] = pages.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          }
        });

        setPageData(formattedPageData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const formatTimeDifference = (createdAt: string): string => {
    const now = new Date();
    const created = new Date(createdAt);
    return formatDistanceToNow(created, { addSuffix: true });
  };

  const renderVisualArt = (item: ArtItem, index: number) => {
    return (
      <div className="post" key={index}>
        <div className="post-header">
          <img src={user.picture} alt={user.name} className="user-pfp" />
          {/* These just link back to feed but make them go to the correct user */}
          <a href={"feed"} className="username">
            {user.name}
          </a>
          <p className="creation-time">{formatTimeDifference(item.createdAt)}</p>
        </div>
        <div className="post-body">
          <img src={item.content} alt={item.title} className="cloud-img" />
        </div>
        <div className="post-footer">
          <h1 className="add-to-colab">
            <Link to="">Add to this Colab</Link>
          </h1>
        </div>
      </div>
    );
  };

  const renderPageStory = (item: PageItem, index: number) => {
    const pages = pageData[item.id] || [];
  
    return (
      <div className="post" key={index}>
        <div className="post-header">
          <img src={user.picture} alt={user.name} className="user-pfp" />
          {/* These just link back to feed but make them go to the correct user */}
          <a href={"feed"} className="username">
            {user.name}
          </a>
          <p className="creation-time">{formatTimeDifference(item.createdAt)}</p>
        </div>
        <div className="post-body">
          <div className="story" key={index}>
            <h1>
              {item.coverImage} {item.title}
            </h1>
            {pages.map((page: PageItem) => (
              <p className="story-content" key={page.id}>
                {page.content}
              </p>
            ))}
          </div>
        </div>
        <div className="post-footer">
          <h1 className="add-to-colab">
            <Link to="">Add to this Colab</Link>
          </h1>
        </div>
      </div>
    );
  };

  const renderMusic = (item: Music, index: number) => {
    return (
      <div className="post" key={index}>
        <div className="post-header">
          <img src={user.picture} alt={user.name} className="user-pfp" />
          {/* These just link back to feed but make them go to the correct user */}
          <a href={"feed"} className="username">
            {user.name}
          </a>
          <p className="creation-time">{formatTimeDifference(item.createdAt)}</p>
        </div>
        <div className="post-body">
          <h1>{item.songTitle}</h1>
          <div className="music-player">
            <audio controls>
              <source src={item.url} type="audio/mp3" />
              Your browser does not support the audio tag.
            </audio>
          </div>
        </div>
        <div className="post-footer">
          <h1 className="add-to-colab">
            <Link to="/trimmer">Add to this Colab</Link>
          </h1>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="loading-container">Loading ...</div>;
  }

  return (
    <div className="post-container">
      {feedData && feedData.map((item, index) => {
         if ('coverImage' in item) {
          return renderPageStory(item as PageItem, index);
        } else if ('songTitle' in item) {
          return renderMusic(item as Music, index);
        } else if ('url' in item) {
          return renderVisualArt(item as ArtItem, index);
        }
        return null;
      })}
    </div>
  );
};

export default Feed;
