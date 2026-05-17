import { useEffect, useState } from 'react';
import { Search, BookOpen, SlidersHorizontal, X } from 'lucide-react';
import { courseApi } from '../api/services';
import CourseCard from '../components/CourseCard';
import Loading from '../components/Loading';

const mockCourses = [
  { courseId: 1, title: 'Mastering Full-Stack Development', description: 'Learn React, Spring Boot, and Microservices.', category: 'Web Development', level: 'Intermediate', language: 'English', instructor: 'Dr. Sarah Connor', price: 99, totalDuration: 1200, thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80' },
  { courseId: 2, title: 'UI/UX Principles for Devs', description: 'Design beautiful, accessible interfaces. Master Figma and CSS.', category: 'Design', level: 'Beginner', language: 'English', instructor: 'Alice Smith', price: 49, totalDuration: 450, thumbnailUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=600&q=80' },
  { courseId: 3, title: 'Advanced Cloud Architecture', description: 'Deploy, scale, and manage infrastructure on AWS and Kubernetes.', category: 'Cloud Computing', level: 'Advanced', language: 'English', instructor: 'Dr. Alan Turing', price: 149, totalDuration: 1800, thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80' },
  { courseId: 4, title: 'Data Structures in Java', description: 'Ace your coding interviews by mastering core algorithms.', category: 'Computer Science', level: 'Intermediate', language: 'Hindi', instructor: 'Prof. Ravi Kumar', price: 0, totalDuration: 900, thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80' },
  { courseId: 5, title: 'Machine Learning Fundamentals', description: 'From linear regression to neural networks — learn ML from scratch.', category: 'Data Science', level: 'Beginner', language: 'English', instructor: 'Dr. Sarah Connor', price: 79, totalDuration: 1100, thumbnailUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80' },
  { courseId: 6, title: 'React Native Mobile Apps', description: 'Build cross-platform mobile apps with React Native and Expo.', category: 'Mobile Development', level: 'Intermediate', language: 'English', instructor: 'Alice Smith', price: 89, totalDuration: 1050, thumbnailUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80' },
];

const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
const LANGUAGES = ['All Languages', 'English', 'Hindi', 'Spanish', 'French'];

export default function Courses() {
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeLevel, setActiveLevel] = useState('All Levels');
  const [activeLanguage, setActiveLanguage] = useState('All Languages');
  const [instructorFilter, setInstructorFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('all'); // all | free | paid

  async function loadCourses(search = '') {
    setLoading(true);
    try {
      const list = search ? await courseApi.search(search) : await courseApi.all();
      setAllCourses(list && list.length > 0 ? list : mockCourses);
    } catch {
      setAllCourses(mockCourses);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCourses(); }, []);

  // Derive categories dynamically from data
  const categories = ['All', ...new Set(allCourses.map(c => c.category).filter(Boolean))];
  const instructors = [...new Set(allCourses.map(c => c.instructor).filter(Boolean))];

  const filtered = allCourses.filter(c => {
    if (activeCategory !== 'All' && c.category !== activeCategory) return false;
    if (activeLevel !== 'All Levels' && c.level !== activeLevel) return false;
    if (activeLanguage !== 'All Languages' && c.language !== activeLanguage) return false;
    if (instructorFilter && c.instructor !== instructorFilter) return false;
    if (priceFilter === 'free' && Number(c.price) !== 0) return false;
    if (priceFilter === 'paid' && Number(c.price) === 0) return false;
    return true;
  });

  const activeFilterCount = [
    activeCategory !== 'All',
    activeLevel !== 'All Levels',
    activeLanguage !== 'All Languages',
    !!instructorFilter,
    priceFilter !== 'all',
  ].filter(Boolean).length;

  function clearFilters() {
    setActiveCategory('All');
    setActiveLevel('All Levels');
    setActiveLanguage('All Languages');
    setInstructorFilter('');
    setPriceFilter('all');
    setKeyword('');
    loadCourses();
  }

  return (
    <section className="page-stack">
      <div className="auth-copy" style={{ borderRadius: 'var(--radius-lg)', padding: '40px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '12px' }}>Course Catalog</h1>
        <p style={{ maxWidth: '600px' }}>Explore our premium library. Filter by category, level, language, or instructor.</p>
      </div>

      {/* Search + Filter toggle bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <form className="search-box" onSubmit={(e) => { e.preventDefault(); loadCourses(keyword); }} style={{ flex: '1', minWidth: '280px' }}>
          <Search size={20} color="var(--text-muted)" />
          <input
            placeholder="Search courses, skills, or instructors..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ background: 'transparent', border: 'none' }}
          />
          {keyword && <button type="button" onClick={() => { setKeyword(''); loadCourses(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 4px' }}><X size={16} /></button>}
        </form>

        <button
          type="button"
          className={`button ${showFilters ? 'button-primary' : 'button-secondary'}`}
          onClick={() => setShowFilters(p => !p)}
          style={{ gap: '8px', position: 'relative' }}
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button type="button" className="button button-secondary" onClick={clearFilters} style={{ gap: '6px', color: '#f43f5e' }}>
            <X size={15} /> Clear all
          </button>
        )}
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
            className={`button ${activeCategory === cat ? 'button-primary' : 'button-secondary'}`}
            style={{ minHeight: '36px', whiteSpace: 'nowrap', padding: '0 14px', fontSize: '13px' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', padding: '20px' }}>
          {/* Level */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Level</label>
            <select value={activeLevel} onChange={e => setActiveLevel(e.target.value)} style={{ width: '100%', background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text-main)' }}>
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>

          {/* Language */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Language</label>
            <select value={activeLanguage} onChange={e => setActiveLanguage(e.target.value)} style={{ width: '100%', background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text-main)' }}>
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>

          {/* Instructor */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Instructor</label>
            <select value={instructorFilter} onChange={e => setInstructorFilter(e.target.value)} style={{ width: '100%', background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text-main)' }}>
              <option value="">All Instructors</option>
              {instructors.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>

          {/* Price */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Price</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[['all', 'All'], ['free', 'Free'], ['paid', 'Paid']].map(([v, label]) => (
                <button key={v} type="button" onClick={() => setPriceFilter(v)}
                  style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: priceFilter === v ? 'var(--primary)' : 'var(--surface-solid)', color: priceFilter === v ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Showing <strong style={{ color: 'var(--text-main)' }}>{filtered.length}</strong> of {allCourses.length} courses
          {activeFilterCount > 0 && ' (filtered)'}
        </p>
      )}

      {loading ? (
        <Loading label="Loading amazing content..." />
      ) : filtered.length ? (
        <div className="course-grid">
          {filtered.map((course) => (
            <CourseCard key={course.courseId || course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="state-box" style={{ background: 'var(--surface-solid)', border: '1px dashed var(--border)' }}>
          <BookOpen size={48} style={{ color: 'var(--text-muted)' }} />
          <h3 style={{ marginTop: '16px' }}>No courses found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or search query.</p>
          <button className="button button-secondary" onClick={clearFilters} style={{ marginTop: '16px' }}>Clear Filters</button>
        </div>
      )}
    </section>
  );
}
