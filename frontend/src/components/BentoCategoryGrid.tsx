import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const BentoCategoryGrid: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const categories = [
    { 
      id: 'ROADS', 
      iconSrc: '/bento/pothole.png', 
      title: t('cat_roads'), 
      desc: t('cat_roads_desc'),
      itemClass: 'bento-item-peach',
    },
    { 
      id: 'WATER', 
      iconSrc: '/bento/pipe.png', 
      title: t('cat_water'), 
      desc: t('cat_water_desc'),
      itemClass: 'bento-item-aqua',
    },
    { 
      id: 'SANITATION', 
      iconSrc: '/bento/waste.png', 
      title: t('cat_sanitation'), 
      desc: t('cat_sanitation_desc'),
      itemClass: 'bento-item-sand',
    },
    { 
      id: 'ELECTRICITY', 
      iconSrc: '/bento/cable.png', 
      title: t('cat_lighting'), 
      desc: t('cat_lighting_desc'),
      itemClass: 'bento-item-lavender',
    },
    { 
      id: 'SAFETY', 
      iconSrc: '/bento/manhole.png', 
      title: t('cat_safety'), 
      desc: t('cat_safety_desc'),
      itemClass: 'bento-item-peach',
    },
    { 
      id: 'PARKS', 
      iconSrc: '/bento/park.png', 
      title: t('cat_parks'), 
      desc: t('cat_parks_desc'),
      itemClass: 'bento-item-sage',
    },
  ];

  return (
    <div style={{ marginBottom: 36 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">{t('what_needs_fixing')}</h2>
          <p className="section-subtitle">{t('choose_category')}</p>
        </div>
      </div>
      
      <div className="bento-grid">
        {categories.map((cat) => (
          <div 
            key={cat.id} 
            className={`bento-item ${cat.itemClass}`} 
            onClick={() => navigate('/citizen/new', { state: { preselectCategory: cat.id } })}
          >
            <div className="bento-icon-container">
              <picture>
                <source srcSet={cat.iconSrc.replace(/\.(png|jpg)$/, '.webp')} type="image/webp" />
                <img 
                  src={cat.iconSrc} 
                  alt={cat.title} 
                  className="bento-icon-img"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </div>
            
            <div className="bento-text-content">
              <div className="bento-title">{cat.title}</div>
              <div className="bento-desc">{cat.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
