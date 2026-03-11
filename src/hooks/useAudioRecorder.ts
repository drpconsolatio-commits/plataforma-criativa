import { useState, useRef } from "react";

export function useAudioRecorder(onTranscriptionSuccess: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        const formData = new FormData();
        formData.append('file', audioBlob, 'record.webm');

        try {
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (data.text) {
            onTranscriptionSuccess(data.text);
          } else {
            console.error("Transcribe API error:", data.error);
            alert("Erro na transcrição do áudio.");
          }
        } catch (error) {
          console.error("Error sending audio:", error);
          alert("Falha de conexão com a API de voz.");
        } finally {
          setIsTranscribing(false);
          stream.getTracks().forEach(track => track.stop()); // Libera o mic
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied:", err);
      alert("Por favor, permita o acesso ao microfone para usar esse recurso.");
    }
  };

  return { isRecording, isTranscribing, toggleRecording };
}
