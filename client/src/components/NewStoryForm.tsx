import React, { useState, useEffect } from 'react';
import TTS from './TTS';
import '../styles.css';
import axios from 'axios';

interface Page {
  id?: number;
  page_number: number;
  content: string;
  story: string;
}

interface Story {
  id?: number;
  title: string;
  coverImage: string | null;
  numberOfPages: number | null;
}

interface NewStoryFormProps {
  onCreateStory: (story: Story) => void;
  onCancel: () => void;
}

const NewStoryForm: React.FC<{ onCreateStory: (story: Story) => void, onCancel: () => void }> = ({ onCreateStory, onCancel }) => {
  const [title, setTitle] = useState('');
  // const [collaborators, setCollaborators] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [numberOfPages, setNumberOfPages] = useState<number | null>(null);
  const [speakText, setSpeakText] = useState('');

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  // const handleCollaboratorsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setCollaborators(event.target.value);
  // };


  const handleCoverImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append('coverImage', file);
      try {
        const response = await axios.post('/api/stories/upload', formData);
        setCoverImage(file);
        setCoverImageUrl(response.data.imageUrl);
      } catch (error) {
        console.error('Error uploading image to server:', error);
      }
    }
  };



  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const story: Story = {
      title,
      coverImage: coverImageUrl,
      numberOfPages
    };

    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(story),
      });

      const data = await response.json();
      console.log(data);
      if (response.ok) {
        console.log('Story created successfully-client');
        //trying to grab the story id
        onCreateStory(data);
      } else {
        console.error('Story not created-client');
      }
    } catch (error) {
      console.error('Unable to save story to database-client', error);
    }
  };


  const handleCancel = () => {
    onCancel();
  };

  const hoverTimeout = React.useRef<any>(null);

  const handleHover = (text: string) => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    hoverTimeout.current = setTimeout(() => {
      setSpeakText(text);
    }, 1000);
  };

  const handleLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    setSpeakText('');
  };

  return (
    <form onSubmit={ handleSubmit } className="new-story-form">
      <div>
        <label htmlFor="title">Title:</label>
        <input
          placeholder='Title'
          type="text"
          id="title"
          value={ title }
          onChange={ handleTitleChange }
          onMouseEnter={() => handleHover('Title')}
          onMouseLeave={() => handleLeave()} />
      </div>
      {/* <div>
        <label htmlFor="collaborators">Collaborators:</label>
        <input type="text" id="collaborators" value={ collaborators } onChange={ handleCollaboratorsChange } />
      </div> */}
      <div>
        <label htmlFor="coverImage">Cover Image:</label>
        <input
          placeholder='coverImage'
          type="file"
          id="coverImage"
          accept="image/*"
          onChange={ handleCoverImageChange }
          onMouseEnter={() => handleHover('Cover Image')}
          onMouseLeave={() => handleLeave()} />
      </div>
      <button
        type="submit"
        onMouseEnter={() => handleHover('Create Story')}
        onMouseLeave={() => handleLeave()}>
        Create Story
      </button>
      <button
        type="button"
        onClick={ handleCancel }
        onMouseEnter={() => handleHover('Cancel')}
        onMouseLeave={() => handleLeave()}>
        Cancel
      </button>
      {speakText && <TTS text={ speakText } />}
    </form>
  );
};

export default NewStoryForm;