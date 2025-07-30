export interface Subtitle {
  text: string;
  duration: number;
}

export interface Short {
  id: number;
  title: string;
  subtitles: Subtitle[];
}
