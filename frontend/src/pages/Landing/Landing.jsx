import React from 'react';
import Hero from '../../components/Hero/Hero';
import Features from '../../components/Features/Features';
import GamificationSection from '../../components/GamificationSection/GamificationSection';
import CareerLadder from '../../components/CareerLadder/CareerLadder';

const Landing = () => {
  return (
    <>
      <Hero />
      <Features />
      <CareerLadder />
      <GamificationSection />
    </>
  );
};

export default Landing;
