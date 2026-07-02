import React from 'react';
import Hero from '../../components/Hero/Hero';
import Features from '../../components/Features/Features';
import GamificationSection from '../../components/GamificationSection/GamificationSection';
import CareerLadder from '../../components/CareerLadder/CareerLadder';
import Testimonials from '../../components/Testimonials/Testimonials';

const Landing = () => {
  return (
    <>
      <Hero />
      <Features />
      <GamificationSection />
      <CareerLadder />
      <Testimonials />
    </>
  );
};

export default Landing;
