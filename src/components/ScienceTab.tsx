import { ExternalLink } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Perceptual Learning',
    body: 'Your brain can learn to see better. Neurons in your primary visual cortex (V1) become more sensitive to contrast through repeated practice with Gabor patterns — the same oriented stripe signals your eyes naturally detect. This is called perceptual learning, and it works even in adults.',
  },
  {
    title: 'Lateral Masking',
    body: 'When flanking patterns are placed near a target, they can either suppress or enhance your ability to detect it. Training with these flankers teaches your brain to reduce neural noise and amplify the signal — like tuning a radio to get clearer reception on the same frequency.',
  },
  {
    title: 'The Adaptive Staircase',
    body: 'Each trial adjusts difficulty based on your previous answers using a Bayesian algorithm called QUEST. If you get it right, the next one is harder. If you miss it, it gets easier. This keeps you training at exactly the right challenge level — your personal threshold.',
  },
  {
    title: 'What Improves',
    body: 'Published studies show improvements in contrast sensitivity (ability to detect faint patterns), visual acuity (sharpness measured in Snellen lines), and processing speed. These gains transfer to real-world tasks like reading and driving.',
  },
];

const STUDIES = [
  {
    authors: 'Polat U, Ma-Naim T, Belkin M, Sagi D',
    year: 2004,
    title: 'Improving vision in adult amblyopia by perceptual learning',
    journal: 'PNAS 101(17):6692-6697',
    url: 'https://doi.org/10.1073/pnas.0401200101',
  },
  {
    authors: 'Polat U, Ma-Naim T, Spierer A',
    year: 2009,
    title: 'Treatment of presbyopia with perceptual learning',
    journal: 'PNAS (FDA Phase II)',
    url: 'https://doi.org/10.1073/pnas.0908200106',
  },
  {
    authors: 'Polat U',
    year: 2009,
    title: 'Making perceptual learning practical to improve visual functions',
    journal: 'Vision Research 49(21):2566-2573',
    url: 'https://doi.org/10.1016/j.visres.2009.06.005',
  },
  {
    authors: 'Lev M, Polat U',
    year: 2015,
    title: 'Space and time in masking and crowding',
    journal: 'Journal of Vision 15(13):10',
    url: 'https://doi.org/10.1167/15.13.10',
  },
];

export function ScienceTab() {
  return (
    <section className="science-tab">
      <h2 className="science-tab__heading">How Vision Training Works</h2>
      <p className="science-tab__intro">
        This app is based on published neuroscience research. Here is how it works, in plain language.
      </p>

      <div className="science-cards">
        {SECTIONS.map((section) => (
          <article key={section.title} className="science-card glass-card">
            <h3 className="science-card__title">{section.title}</h3>
            <p className="science-card__body">{section.body}</p>
          </article>
        ))}
      </div>

      <h3 className="science-tab__subheading">Published Studies</h3>
      <div className="science-cards">
        {STUDIES.map((study) => (
          <article key={study.url} className="science-card glass-card">
            <h4 className="science-card__title">{study.title}</h4>
            <p className="science-card__body">
              {study.authors} ({study.year}). <em>{study.journal}</em>
            </p>
            <a
              href={study.url}
              target="_blank"
              rel="noopener noreferrer"
              className="science-card__link"
            >
              <ExternalLink size={14} />
              Read paper
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
