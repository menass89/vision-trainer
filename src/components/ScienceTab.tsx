import { ExternalLink } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SceneHeader } from './SceneHeader';

const SECTIONS = [
  {
    title: 'Your Brain Can Learn to See Better',
    body: 'Vision isn\'t just about your eyes — most of the work happens in your brain. With the right kind of practice, your brain gets better at picking up faint details it used to miss. Scientists call this "perceptual learning." It works at any age, even if your eyesight has been the same for years.',
  },
  {
    title: 'How the Exercises Work',
    body: 'You\'ll see faint striped patterns appear on screen and choose which side they\'re on. Some have distracting patterns around them to make it harder. This trains your brain to filter out visual noise and focus on what matters — the same skill you use when reading small text or spotting a ball in flight.',
  },
  {
    title: 'It Gets Harder as You Improve',
    body: 'The app tracks every answer and automatically adjusts difficulty. Get a few right? The next one is a little harder. Struggling? It eases off. You\'re always training at the edge of what you can see — that\'s where improvement happens fastest.',
  },
  {
    title: 'What Changes in Practice',
    body: 'People in clinical studies read one or more extra lines on the eye chart after 30 sessions. They also reported clearer everyday vision — sharper reading, better night driving, faster reaction times. These aren\'t temporary effects. The brain changes stick.',
  },
];

const STUDIES = [
  {
    label: 'Polat et al. 2004',
    summary: 'Adults with lazy eye gained one full line on the eye chart through perceptual learning alone — no surgery, no lenses.',
    url: 'https://doi.org/10.1073/pnas.0401200101',
  },
  {
    label: 'Polat et al. 2009',
    summary: 'FDA Phase II clinical trial. 70% of participants with age-related farsightedness improved by at least one line after training.',
    url: 'https://doi.org/10.1073/pnas.0908200106',
  },
  {
    label: 'Polat 2009 (Review)',
    summary: 'Overview of how perceptual learning translates into practical vision improvement across multiple conditions.',
    url: 'https://doi.org/10.1016/j.visres.2009.06.005',
  },
  {
    label: 'Lev & Polat 2015',
    summary: 'Research on how surrounding visual noise affects detection — the science behind our lateral masking exercises.',
    url: 'https://doi.org/10.1167/15.13.10',
  },
];

export function ScienceTab() {
  const timePhase = useAppStore((s) => s.timePhase);

  return (
    <section className="science-screen">
      <SceneHeader phase={timePhase} title="The Science" />

      <p className="science-screen__intro">
        Built on peer-reviewed neuroscience. No gimmicks — just well-studied brain training that actually improves vision.
      </p>

      <div className="science-cards">
        {SECTIONS.map((section) => (
          <article key={section.title} className="science-card glass-card">
            <h3 className="science-card__title">{section.title}</h3>
            <p className="science-card__body">{section.body}</p>
          </article>
        ))}
      </div>

      <h3 className="science-screen__subheading">The Research</h3>
      <div className="science-cards">
        {STUDIES.map((study) => (
          <article key={study.url} className="science-card glass-card">
            <h4 className="science-card__title">{study.label}</h4>
            <p className="science-card__body">{study.summary}</p>
            <a
              href={study.url}
              target="_blank"
              rel="noopener noreferrer"
              className="science-card__link"
              aria-label={`Read the study: ${study.label}`}
            >
              <ExternalLink size={14} />
              Read the study
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
