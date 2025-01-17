import React, { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import paper, { Color } from 'paper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faPenFancy, faPalette, faEraser, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';

interface DrawProps {
  backgroundColor: string;
  handleBackgroundColorChange: (color: string) => void;
}

const Draw: React.FC<DrawProps> = ({ backgroundColor, handleBackgroundColorChange }) => {
  const { user } = useAuth0();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathRef = useRef<paper.Path | null>(null);
  const penColorRef = useRef<Color>(new Color('white'));
  const [selectedColor, setSelectedColor] = useState<string>(penColorRef.current.toCSS(true));
  const [penWidth, setPenWidth] = useState(5);
  const penWidthRef = useRef<number>(penWidth);
  const [eraseMode, setEraseMode] = useState(false);
  const [showPenWidthSlider, setShowPenWidthSlider] = useState(false);

  const handlePenColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    penColorRef.current = new Color(value);
    setSelectedColor(value);

    if (pathRef.current) {
      pathRef.current.strokeColor = penColorRef.current;
      paper.view.update();
    }
  };

  const handlePenWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const width = Number(value);
    setPenWidth(width);
    penWidthRef.current = width;
  };

  const handlePenWidthButtonClick = () => {
    setShowPenWidthSlider(true);
  };

  const handlePenWidthSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const width = Number(value);
    setPenWidth(width);
    penWidthRef.current = width;
  };

  const handlePenWidthSliderClose = () => {
    setShowPenWidthSlider(false);
  };

  const handleEraserClick = () => {
    setEraseMode((prevState) => {
      if (prevState) {
        penColorRef.current = new Color(selectedColor);
        return false;
      } else {
        penColorRef.current = new Color(backgroundColor);
        return true;
      }
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    paper.setup(canvas);

    const tool = new paper.Tool();

    tool.onMouseDown = (event: paper.ToolEvent) => {
      const path = new paper.Path();
      path.strokeColor = penColorRef.current;
      path.strokeWidth = penWidthRef.current;
      path.strokeCap = 'smooth';
      path.strokeJoin = 'round';
      path.add(event.point);
      pathRef.current = path;
    };

    tool.onMouseDrag = (event: paper.ToolEvent) => {
      if (pathRef.current) {
        pathRef.current.add(event.point);
      }
    };

    tool.onMouseUp = () => {
      pathRef.current = null;
    };

    const resizeCanvas = () => {
      paper.view.viewSize = new paper.Size(canvas.clientWidth, canvas.clientHeight);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      tool.remove();
    };
  }, []);

  const saveArt = async (art: string) => {
    try {
      await axios.post('/visualart', { art, user });
    } catch (err) {
      console.error('Failed to SAVE art to db at client:', err);
    }
  };

  const handleSaveClick = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const { width, height } = canvas;
    const { backgroundColor } = getComputedStyle(canvas);

    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);

    const paths = paper.project.activeLayer.children;
    paths.forEach((path) => {
      context.strokeStyle = path.strokeColor.toCSS(true);
      context.lineWidth = path.strokeWidth;
      context.lineCap = 'round';
      context.lineJoin = 'round';

      path.segments.forEach((segment, index) => {
        if (index === 0) {
          context.beginPath();
          context.moveTo(segment.point.x, segment.point.y);
        } else {
          context.lineTo(segment.point.x, segment.point.y);
        }
      });

      context.stroke();
    });

    const art = canvas.toDataURL();

    await saveArt(art);
  };

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        id="canvas"
        ref={canvasRef}
        style={{ width: '100vw', height: '100vh', backgroundColor }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '5%',
          transform: 'translateY(-50%)',
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <input
              type="color"
              id="bg-color"
              value={backgroundColor}
              onChange={handleBackgroundColorChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => document.getElementById('bg-color')?.click()}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: 'white',
                fontSize: '2.5rem',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            >
              <FontAwesomeIcon icon={faPalette} />
            </button>
          </div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <input
              type="color"
              id="pen-color"
              value={selectedColor}
              onChange={handlePenColorChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => document.getElementById('pen-color')?.click()}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: 'white',
                fontSize: '2.5rem',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            >
              <FontAwesomeIcon icon={faPen} />
            </button>
          </div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handlePenWidthButtonClick}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: 'white',
                fontSize: '2.5rem',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            >
              <FontAwesomeIcon icon={faPenFancy} />
            </button>
            {showPenWidthSlider && (
              <div className="pen-width-slider">
                <input
                  type="range"
                  value={penWidth.toString()}
                  onChange={handlePenWidthSliderChange}
                  min={1}
                  max={100}
                  className="slider is-small"
                />
                <button
                  type="button"
                  onClick={handlePenWidthSliderClose}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '2.5rem',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <button
              onClick={handleEraserClick}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: 'white',
                fontSize: '2.5rem',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            >
              <FontAwesomeIcon icon={faEraser} />
            </button>
          </div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <button
              type="submit"
              onClick={handleSaveClick}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: 'white',
                fontSize: '2.5rem',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            >
              <FontAwesomeIcon icon={faFloppyDisk} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );


};

export default Draw;
