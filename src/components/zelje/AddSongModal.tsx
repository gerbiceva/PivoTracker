import {
  Modal,
  TextInput,
  Group,
  Button,
  Stack,
  Box,
} from '@mantine/core';
import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { addZeljeSong } from '../../supabase/zelje';

interface AddSongModalProps {
  opened: boolean;
  onClose: () => void;
  onSongAdded: () => void;
}

export const AddSongModal = ({ opened, onClose, onSongAdded }: AddSongModalProps) => {
  const [songName, setSongName] = useState('');
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const videoConstraints = {
    facingMode: 'user',
    width: 320,
    height: 320,
  };

  const takePhoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    setSelfieUrl(imageSrc || null);
    setShowCamera(false);
  };

  const handleClose = () => {
    setShowCamera(false);
    setSelfieUrl(null);
    setSongName('');
    onClose();
  };

  const isValid = songName.trim().length > 0 && selfieUrl !== null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const songName = formData.get('song_name') as string;

    if (!songName.trim() || !selfieUrl) return;

    setLoading(true);
    try {
      await addZeljeSong(songName.trim(), selfieUrl);
      onSongAdded();
      (e.target as HTMLFormElement).reset();
      setSelfieUrl(null);
      setSongName('');
      onClose();
    } catch (error) {
      console.error('Error adding song:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Dodaj novo pesem" centered radius="lg" size="xl">
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            name="song_name"
            label="Ime pesmi"
            placeholder="npr. Bohemian Rhapsody"
            required
            size='xl'
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
          />
          <Group justify="center">
            {selfieUrl ? (
              <Stack align="center" gap="xs">
                <Box
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 16,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={selfieUrl}
                    alt="Selfie"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
                <Button variant="subtle" size="xs" onClick={() => setSelfieUrl(null)}>
                  Odstrani
                </Button>
              </Stack>
            ) : showCamera ? (
              <Stack align="center" gap="xs">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  mirrored
                  screenshotFormat="image/png"
                  videoConstraints={videoConstraints}
                  style={{ width: "100%", height: "100%", borderRadius: 16 }}
                />
                <Group gap="xs">
                  <Button variant="light" color="red" size="lg" onClick={() => setShowCamera(false)}>
                    Prekliči
                  </Button>
                  <Button variant="filled" color="green" size="lg" onClick={takePhoto}>
                    📸 Shrani
                  </Button>
                </Group>
              </Stack>
            ) : (
              <Button variant="light" size="xl" color="violet" onClick={() => setShowCamera(true)}>
                📸 selfie
              </Button>
            )}
          </Group>
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose} type="button">
              Prekliči
            </Button>
            <Button type="submit" loading={loading} disabled={!isValid}>
              Dodaj
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
