import type { Viewport } from 'next';
import { Maths, Problem, Who } from '@/components/Sections';
import { ToolBar, ToolFoot } from '@/components/Shell';
import UptimeTool from '@/components/UptimeTool';
import './page.css';

export const viewport: Viewport = { themeColor: '#0f0e0c', colorScheme: 'light' };

export default function Page() {
  return (
    <>
      <ToolBar />
      <main>
        <UptimeTool />
        <Problem />
        <Maths />
        <Who />
      </main>
      <ToolFoot />
    </>
  );
}
