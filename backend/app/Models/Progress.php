<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Progress extends Model
{
    protected $table = 'progress'; protected $fillable = ['user_id','skill_id','completed_lessons','is_completed','practice_answers','reflection_answers','bookmarked','favorite','notes','completed_at'];
    protected $casts = ['completed_lessons'=>'array','is_completed'=>'boolean','practice_answers'=>'array','reflection_answers'=>'array','bookmarked'=>'boolean','favorite'=>'boolean','notes'=>'array','completed_at'=>'datetime'];
    public function toApiArray(): array { return ['skillId'=>$this->skill_id,'completedLessons'=>$this->completed_lessons??[],'isCompleted'=>(bool)$this->is_completed,'completedAt'=>optional($this->completed_at)->toISOString(),'practiceAnswers'=>$this->practice_answers??[],'reflectionAnswers'=>$this->reflection_answers??[],'bookmarked'=>(bool)$this->bookmarked,'favorite'=>(bool)$this->favorite,'notes'=>$this->notes??[]]; }
}
