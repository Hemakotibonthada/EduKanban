import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Brain, 
  Target, 
  Users, 
  BarChart3, 
  Zap, 
  Star,
  ArrowRight,
  Play,
  CheckCircle,
  TrendingUp,
  MessageCircle,
  Award
} from 'lucide-react';

const LandingPage = ({ onAuthMode }) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-blue-600" />,
      title: "AI-Powered Learning Paths",
      description: "Get personalized learning journeys created by advanced AI based on your goals, level, and schedule."
    },
    {
      icon: <Target className="w-8 h-8 text-green-600" />,
      title: "Adaptive Progress Tracking",
      description: "Smart tracking that adapts to your pace and provides insights to optimize your learning journey."
    },
    {
      icon: <Users className="w-8 h-8 text-purple-600" />,
      title: "Collaborative Learning",
      description: "Connect with peers, share progress, and learn together in our supportive community."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-orange-600" />,
      title: "Advanced Analytics",
      description: "Detailed insights into your learning patterns, strengths, and areas for improvement."
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-600" />,
      title: "Interactive Content",
      description: "Engage with dynamic content, videos, quizzes, and hands-on projects."
    },
    {
      icon: <Award className="w-8 h-8 text-red-600" />,
      title: "Achievement System",
      description: "Celebrate milestones with our comprehensive achievement and badge system."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Developer",
      content: "EduKanban transformed how I learn. The AI-generated learning paths are incredibly accurate and the progress tracking keeps me motivated!",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47b?w=64&h=64&fit=crop&crop=face"
    },
    {
      name: "Mike Rodriguez",
      role: "Data Scientist",
      content: "The community features and peer learning made all the difference. I completed 3 courses in 2 months thanks to the structured approach.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face"
    },
    {
      name: "Emily Watson",
      role: "Product Manager",
      content: "The analytics dashboard helped me understand my learning patterns. Now I'm 50% more efficient in acquiring new skills.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face"
    }
  ];

  const stats = [
    { label: "Active Learners", value: "50K+", icon: <Users className="w-6 h-6" /> },
    { label: "Courses Created", value: "10K+", icon: <BookOpen className="w-6 h-6" /> },
    { label: "Success Rate", value: "94%", icon: <TrendingUp className="w-6 h-6" /> },
    { label: "Hours Learned", value: "2M+", icon: <Play className="w-6 h-6" /> }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5001);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="relative z-10 px-4 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              EduKanban
            </span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <button
              onClick={() => onAuthMode('login')}
              className="px-6 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Sign In
            </button>
            <button
              onClick={() => onAuthMode('register')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
            >
              Get Started
            </button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Master Any Skill with
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}AI-Powered
              </span>
              <br />Learning Paths
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Transform your learning journey with personalized, AI-generated courses that adapt to your pace, 
              style, and goals. From beginner to expert, we guide you every step of the way.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button
                onClick={() => onAuthMode('register')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg flex items-center space-x-2"
              >
                <span>Start Learning Free</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all duration-300 font-semibold text-lg flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center mb-2 text-blue-600">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-gray-600 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}Master New Skills
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform combines cutting-edge AI with proven learning methodologies 
              to create the most effective learning experience possible.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in minutes and see results in days. Our AI-powered system makes learning 
              efficient, engaging, and effective.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Tell Us Your Goals",
                description: "Share what you want to learn, your current level, and how much time you can dedicate.",
                icon: <Target className="w-12 h-12 text-blue-600" />
              },
              {
                step: "02", 
                title: "AI Creates Your Path",
                description: "Our AI generates a personalized learning path with modules, tasks, and assessments tailored just for you.",
                icon: <Brain className="w-12 h-12 text-purple-600" />
              },
              {
                step: "03",
                title: "Learn & Master",
                description: "Follow your Kanban board, complete tasks, take assessments, and track your progress to mastery.",
                icon: <CheckCircle className="w-12 h-12 text-green-600" />
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mx-auto mb-4">
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Loved by Learners Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of successful learners who have transformed their careers with EduKanban.
            </p>
          </motion.div>

          <motion.div
            key={currentTestimonial}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg max-w-2xl mx-auto"
          >
            <div className="flex justify-center mb-4">
              {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
            </div>
            
            <p className="text-lg text-gray-700 mb-6 italic leading-relaxed">
              "{testimonials[currentTestimonial].content}"
            </p>
            
            <div className="flex items-center justify-center space-x-4">
              <img
                src={testimonials[currentTestimonial].avatar}
                alt={testimonials[currentTestimonial].name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="text-left">
                <div className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</div>
                <div className="text-gray-600 text-sm">{testimonials[currentTestimonial].role}</div>
              </div>
            </div>
          </motion.div>

          <div className="flex justify-center space-x-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentTestimonial 
                    ? 'bg-blue-600 scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl mb-10 text-blue-100">
              Join thousands of learners who are already mastering new skills with AI-powered learning paths.
              Start your journey today - it's completely free!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => onAuthMode('register')}
                className="px-10 py-4 bg-white text-blue-600 rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg flex items-center space-x-2"
              >
                <span>Start Learning Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <div className="text-blue-100 text-sm">
                No credit card required • Free forever plan available
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">EduKanban</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                AI-powered personalized learning platform that helps you master any skill efficiently.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 EduKanban. All rights reserved. Built with ❤️ for learners worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;