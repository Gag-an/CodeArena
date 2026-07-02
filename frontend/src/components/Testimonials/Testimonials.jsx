import React from 'react';
import SpriteAvatar from '../SpriteAvatar/SpriteAvatar';
import './Testimonials.css';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      quote: "“Battling my friends in real-time coding matches is insanely fun. It doesn't even feel like learning!”",
      author: "Alex Mercer",
      avatarIndex: 0
    },
    {
      id: 2,
      quote: "“I climbed the leaderboard to Rank 1 and leveled up my Java skills along the way. CodeArena is brilliant.”",
      author: "Sarah Jenkins",
      avatarIndex: 4
    },
    {
      id: 3,
      quote: "“The multiplayer battles are incredibly addictive. It's hands down the best way to practice algorithms.”",
      author: "David Chen",
      avatarIndex: 8
    }
  ];

  return (
    <section className="testimonials-section">
      <div className="testimonials-grid">
        {testimonials.map((testimonial) => (
          <div className="testimonial-card" key={testimonial.id}>
            <div className="avatar-wrapper">
              <SpriteAvatar index={testimonial.avatarIndex} className="testimonial-avatar" />
            </div>
            <p className="testimonial-quote">{testimonial.quote}</p>
            <div className="testimonial-author-info">
              <h4 className="testimonial-author">{testimonial.author}</h4>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
