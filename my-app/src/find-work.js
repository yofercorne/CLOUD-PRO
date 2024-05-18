import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './findWork.css';

const FindWork = () => {
  const [jobs, setJobs] = useState([]);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    company: '',
    jobTitle: '',
    salaryRange: '',
    jobType: '',
    location: null,
  });
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/jobs')
      .then(response => response.json())
      .then(data => {
        setJobs(data);
      })
      .catch(console.error);
  }, []);

  const handleJobClick = (id) => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate(`/job-details/${id}`);
    }
  };

  const renderUserImage = (imgUrl) => {
    const defaultImg = 'path_to_default_image.png';
    const imageUrl = imgUrl ? imgUrl : defaultImg;
    return (
      <img src={imageUrl} onError={(e) => e.target.src = defaultImg} className="job-img" alt="User" />
    );
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <div className="stars">
        {Array.from({ length: fullStars }, (_, index) => (
          <i key={`full-${index}`} className="fa fa-star checked"></i>
        ))}
        {halfStar && <i key="half" className="fa fa-star-half-alt checked"></i>}
        {Array.from({ length: emptyStars }, (_, index) => (
          <i key={`empty-${index}`} className="fa fa-star"></i>
        ))}
      </div>
    );
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-3">
          <h5>Filtros de Búsqueda</h5>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Empresa"
            name="company"
            value={filters.company}
            onChange={(e) => setFilters({ ...filters, company: e.target.value })}
          />
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Título del Trabajo"
            name="jobTitle"
            value={filters.jobTitle}
            onChange={(e) => setFilters({ ...filters, jobTitle: e.target.value })}
          />
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Rango Salarial"
            name="salaryRange"
            value={filters.salaryRange}
            onChange={(e) => setFilters({ ...filters, salaryRange: e.target.value })}
          />
          <select
            className="form-control mb-3"
            name="jobType"
            value={filters.jobType}
            onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
          >
            <option value="">Tipo de Trabajo</option>
            <option value="Tiempo Completo">Tiempo Completo</option>
            <option value="Medio Tiempo">Medio Tiempo</option>
            <option value="Freelance">Freelance</option>
          </select>
          <button
            className="btn btn-outline-secondary w-100 mb-2"
            onClick={() => setShowMap(true)}
          >
            Seleccionar en Mapa
          </button>
          <button
            className="btn btn-primary w-100"
            onClick={() => setFilters({
              company: '',
              jobTitle: '',
              salaryRange: '',
              jobType: '',
              location: null
            })}
          >
            Restablecer Filtros
          </button>
        </div>
        <div className="col-md-9">
          <h2 className="mb-4">Trabajos Disponibles</h2>
          <div className="list-group">
            {jobs.map(job => (
              <div key={job.id} className="list-group-item list-group-item-action flex-column align-items-start mb-3 job-item" onClick={() => handleJobClick(job.id)}>
                <div className="d-flex w-100 justify-content-between">
                  <div className="d-flex">
                    {renderUserImage(job.user_img)}
                    <div>
                      <h5 className="mb-1">{job.job_title}</h5>
                      <div className="list-rating">
                        {renderStars(job.rating)}
                      </div>
                      <p className="mb-1">{job.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <small className="text-muted"><i className="fa fa-industry mr-1"></i> {job.company}</small><br />
                    <small className="text-muted"><i className="fa fa-map-marker-alt mr-1"></i> {job.location}</small><br />
                    <small className="text-muted"><i className="fa fa-dollar-sign mr-1"></i> ${job.salary}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindWork;
