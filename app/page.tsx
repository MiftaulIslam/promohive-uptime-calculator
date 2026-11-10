import type { Viewport } from 'next';
import { FAQ, Guide } from '@/components/Guide';
import { Maths, Problem, Who } from '@/components/Sections';
import { ToolBar, ToolFoot, ToolJsonLd } from '@/components/Shell';
import UptimeTool from '@/components/UptimeTool';
import { tool } from '@/lib/tool';
import './page.css';

export const viewport: Viewport = { themeColor: tool.themeColor, colorScheme: 'light' };

export default function Page() {
  return (
    <>
      <ToolBar />
      <main>
        <UptimeTool />
        <Problem />
        <Maths />
        <Who />
        <Guide />
      </main>
      <ToolFoot />
      <ToolJsonLd faq={FAQ} />
    </>
  );
}
