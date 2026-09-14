<?php
namespace App\Models;
use App\Support\LearningXp;
use Illuminate\Database\Eloquent\Model;
class Progress extends Model
{
    protected $table = 'progress'; protected $fillable = ['user_id','skill_id','completed_lessons','awarded_lesson_ids','is_completed','practice_answers','practice_results','reflection_answers','bookmarked','favorite','notes','learning_seconds','last_learning_at','completed_at','skill_bonus_awarded_at'];
    protected $casts = ['completed_lessons'=>'array','awarded_lesson_ids'=>'array','is_completed'=>'boolean','practice_answers'=>'array','practice_results'=>'array','reflection_answers'=>'array','bookmarked'=>'boolean','favorite'=>'boolean','notes'=>'array','learning_seconds'=>'integer','last_learning_at'=>'datetime','completed_at'=>'datetime','skill_bonus_awarded_at'=>'datetime'];
    public function toApiArray(): array { return ['skillId'=>$this->skill_id,'completedLessons'=>$this->completed_lessons??[],'isCompleted'=>(bool)$this->is_completed,'completedAt'=>optional($this->completed_at)->toISOString(),'practiceAnswers'=>$this->practice_answers??[],'practiceResults'=>$this->practice_results??[],'reflectionAnswers'=>$this->reflection_answers??[],'bookmarked'=>(bool)$this->bookmarked,'favorite'=>(bool)$this->favorite,'notes'=>$this->notes??[],'learningSeconds'=>(int)$this->learning_seconds,'lastStudiedAt'=>optional($this->last_learning_at)->toISOString(),'xpEarned'=>count($this->awarded_lesson_ids ?? []) * LearningXp::LESSON_COMPLETED + ($this->skill_bonus_awarded_at ? LearningXp::SKILL_COMPLETED : 0)]; }
}
