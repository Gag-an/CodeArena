import React from 'react';
import SpriteAvatar from '../SpriteAvatar/SpriteAvatar';
import './Testimonials.css';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      quote: "“I haven't had this much raw fun coding in 10 years.”",
      author: "Philippe Beaudoin",
      avatarIndex: 0
    },
    {
      id: 2,
      quote: "“CodeArena completely transformed how I prepare for technical interviews.”",
      author: "Sarah Jenkins",
      avatarIndex: 4
    },
    {
      id: 3,
      quote: "“The multiplayer battles are incredibly addictive. It's the best way to learn.”",
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
