import React from 'react';
import './Testimonials.css';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      quote: "“I haven't had this much raw fun coding in 10 years.”",
      author: "Philippe Beaudoin",
      role: "Software Developer at Google",
      avatar: "https://i.pravatar.cc/150?img=11"
    },
    {
      id: 2,
      quote: "“CodeArena completely transformed how I prepare for technical interviews.”",
      author: "Sarah Jenkins",
      role: "Frontend Engineer at Meta",
      avatar: "https://i.pravatar.cc/150?img=5"
    },
    {
      id: 3,
      quote: "“The multiplayer battles are incredibly addictive. It's the best way to learn.”",
      author: "David Chen",
      role: "Full Stack Developer at Amazon",
      avatar: "https://i.pravatar.cc/150?img=12"
    }
  ];

  return (
    <section className="testimonials-section">
      <div className="testimonials-grid">
        {testimonials.map((testimonial) => (
          <div className="testimonial-card" key={testimonial.id}>
            <div className="avatar-wrapper">
              <img src={testimonial.avatar} alt={testimonial.author} className="testimonial-avatar" />
            </div>
            <p className="testimonial-quote">{testimonial.quote}</p>
            <div className="testimonial-author-info">
              <h4 className="testimonial-author">{testimonial.author}</h4>
              <p className="testimonial-role">{testimonial.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
