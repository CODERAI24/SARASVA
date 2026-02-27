import api from "./axios.js";

export const examsApi = {
  getAll:  ()        => api.get("/exams"),
  create:  (data)    => api.post("/exams", data),
  update:  (id, data)=> api.patch(`/exams/${id}`, data),
  archive: (id)      => api.delete(`/exams/${id}`),

  addSubject:    (examId, data)       => api.post(`/exams/${examId}/subjects`, data),
  removeSubject: (examId, subjectId)  => api.delete(`/exams/${examId}/subjects/${subjectId}`),

  addChapter:    (examId, subjectId, data)              =>
    api.post(`/exams/${examId}/subjects/${subjectId}/chapters`, data),

  updateChapter: (examId, subjectId, chapterId, data)   =>
    api.patch(`/exams/${examId}/subjects/${subjectId}/chapters/${chapterId}`, data),

  deleteChapter: (examId, subjectId, chapterId)         =>
    api.delete(`/exams/${examId}/subjects/${subjectId}/chapters/${chapterId}`),
};
