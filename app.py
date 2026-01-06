import os
from unittest import TestResult
from flask import Flask, render_template, redirect, url_for, request, flash, jsonify 
from flask_login import LoginManager, current_user, login_user, logout_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from database.models import db, User, Result
from sqlalchemy import func
from config import Config
from datetime import datetime, time, timedelta
import random
from datetime import timedelta
import pandas as pd
import io
from flask import send_file

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = "Lütfen sayfayı görmek için giriş yapın."
login_manager.login_message_category = "uyari-hata" 


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


with app.app_context():
    db.create_all()



@app.route('/')
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('Kullanıcı adı veya şifre hatalı.', 'uyari-hata')
            
    return render_template('index.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        yas = request.form.get('yas')
        yas = int(yas) if yas else None
        cinsiyet = request.form.get('cinsiyet')
        bolum = request.form.get('bolum')
        user_exists = User.query.filter_by(username=username).first()

        if user_exists:
            flash('Bu kullanıcı adı zaten kullanılıyor.', 'uyari-hata')
            return redirect(url_for('register'))
            
        hashed_password = generate_password_hash(password)
        
        new_user = User(
            username=username, 
            yas=yas, 
            cinsiyet=cinsiyet,
            bolum=bolum,
            password_hash=hashed_password
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        flash('Kayıt başarılı! Lütfen giriş yapın.', 'uyari-basarili')
        return redirect(url_for('login'))

    return render_template('index.html', show_register=True)



@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))



@app.route('/dashboard')
@login_required 
def dashboard():
    bugun = datetime.utcnow() + timedelta(hours=3)
    yedi_gun_once = bugun - timedelta(days=7)
    on_dort_gun_once = bugun - timedelta(days=14)
    
    bu_haftaki_kayitlar = Result.query.filter(
        Result.user_id == current_user.id,
        Result.is_analysis_mode == True,
        Result.timestamp >= yedi_gun_once
    ).order_by(Result.timestamp).all()
    
    gecen_hafta_ort = db.session.query(func.avg(Result.accuracy_percent)).filter(
        Result.user_id == current_user.id,
        Result.is_analysis_mode == True,
        Result.timestamp >= on_dort_gun_once,
        Result.timestamp < yedi_gun_once
    ).scalar()
    
    gunluk_veriler = {}
    for kayit in bu_haftaki_kayitlar:
        tr_zaman = kayit.timestamp + timedelta(hours=3)
        gun_str = tr_zaman.strftime('%d.%m')
        
        if gun_str not in gunluk_veriler:
            gunluk_veriler[gun_str] = []
        gunluk_veriler[gun_str].append(kayit.accuracy_percent)
    
    dates = []
    scores = []
    
    for gun in sorted(gunluk_veriler.keys()):
        gunun_testleri = gunluk_veriler[gun]
        gunun_ortalamasi = sum(gunun_testleri) / len(gunun_testleri)
        dates.append(gun)
        scores.append(round(gunun_ortalamasi, 1))
        
    analiz_mesaji = "Analiz için henüz yeterli veri birikmedi." 
    en_yuksek_skor = 0
    
    if scores:
        en_yuksek_skor = max(scores)
        ters_index = scores[::-1].index(en_yuksek_skor)
        gercek_index = len(scores) - 1 - ters_index
        en_yuksek_tarih = dates[gercek_index]
        
        bu_hafta_ort = sum(scores) / len(scores)
        
        if gecen_hafta_ort is not None:
            fark = round(bu_hafta_ort - gecen_hafta_ort, 1)
            
            if fark > 0:
                yorum = f"Geçen haftaya göre <b>+{fark} puan</b> artış var."
            elif fark < 0:
                yorum = f"Geçen haftaya göre <b>{fark} puan</b> düşüş var. Biraz daha odaklanmalısın."
            else:
                yorum = "Performansın geçen haftayla aynı, dengeli gidiyorsun."
                
            analiz_mesaji = f"{yorum} Ayrıca bu haftaki en yüksek skorun: <b>{en_yuksek_skor}</b> ({en_yuksek_tarih} tarihinde)."
        else:
            analiz_mesaji = f"Bu haftaki performansın kaydedildi. En yüksek skorun: <b>{en_yuksek_skor}</b> ({en_yuksek_tarih} tarihinde)."

    return render_template('dashboard.html', 
                           username=current_user.username, 
                           analiz_mesaji=analiz_mesaji,
                           dates=dates,   
                           scores=scores
                           )


@app.route('/analysis')
@login_required 
def analysis():
    mode = request.args.get('mode')

    if mode != 'training':
        today = datetime.utcnow().date()
        start_of_today = datetime.combine(today, time.min)
        
        daily_analysis_done = Result.query.filter(
            Result.user_id == current_user.id,
            Result.is_analysis_mode == True, 
            Result.timestamp >= start_of_today
        ).first()

        if daily_analysis_done:
            flash(' Günlük analizi bugün zaten tamamladınız.', 'uyari-hata')
            return redirect(url_for('dashboard'))

    return render_template('analysis.html', mode=mode)


@app.route('/training')
@login_required 
def training():
    return render_template('training.html')


def calculate_score(test_type, raw_results):
    
    total_questions = len(raw_results)
    if total_questions == 0:
        return 0, 0

    correct_count = 0
    total_active_time = 0
    active_response_count = 0
    
    for item in raw_results:
      
        if item['dogru'] == item['cevap']:
            correct_count += 1
            
        if item['cevap'] != 'yok':
            total_active_time += item['sure']
            active_response_count += 1
    
    
    accuracy = (correct_count / total_questions) * 100
    
    
    average_speed = 0
    if active_response_count > 0:
        average_speed = total_active_time / active_response_count
    elif test_type == 'SRT' and correct_count > 0:
        
        average_speed = total_active_time / correct_count
        
    return accuracy, average_speed


@app.route('/save_result', methods=['POST'])
@login_required
def save_result():
    data = request.get_json()
    
    test_type = data.get('test_name')  
    raw_trials = data.get('results')   
    mode = data.get('mode')            
    
    
    accuracy, speed = calculate_score(test_type, raw_trials)
    
   
    new_result = Result(
        user_id=current_user.id,
        test_type=test_type,
        reaction_time_ms=speed,
        accuracy_percent=accuracy,
        is_analysis_mode=(mode == 'analysis')
    )
    
    try:
        db.session.add(new_result)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'accuracy': round(accuracy, 1),
            'speed': int(speed)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/get_chart_data')
@login_required
def get_chart_data():
   
    results = Result.query.filter_by(user_id=current_user.id, is_analysis_mode=True)\
        .order_by(Result.timestamp.asc()).all()

    if not results:
        return jsonify({'labels': [], 'data': []})

    gunluk_veriler = {} 
    
    for r in results:
        tr_zaman = r.timestamp + timedelta(hours=3)
        tarih_str = tr_zaman.strftime('%d.%m')
        
        if tarih_str not in gunluk_veriler:
            gunluk_veriler[tarih_str] = []
        
        gunluk_veriler[tarih_str].append(r.accuracy_percent)

    labels = [] 
    data = []   

    for tarih, puanlar in list(gunluk_veriler.items())[-7:]: 
        labels.append(tarih)
        ortalama = sum(puanlar) / len(puanlar)
        data.append(round(ortalama, 1))

    

    return jsonify({
        'labels': labels, 
        'data': data
    })





@app.route('/admin')
@login_required 
def admin_panel():
    if not current_user.is_admin:
        flash('Bu sayfaya erişim yetkiniz yoktur.', 'uyari-hata')
        return redirect(url_for('dashboard'))

  
    f_bolum = request.args.get('bolum', '')
    f_cinsiyet = request.args.get('cinsiyet', '')
    f_test = request.args.get('test_type', '')
    f_yas = request.args.get('yas', '') 
    f_mod = request.args.get('mod', '') 

    query = Result.query.join(User)

   
    if f_bolum:
        query = query.filter(User.bolum.ilike(f"%{f_bolum}%")) 
    if f_cinsiyet:
        query = query.filter(User.cinsiyet == f_cinsiyet)
    if f_test:
        query = query.filter(Result.test_type == f_test)
    if f_yas:
        query = query.filter(User.yas == int(f_yas)) 
    if f_mod:
        is_analiz = True if f_mod == 'analiz' else False
        query = query.filter(Result.is_analysis_mode == is_analiz)

    all_results = query.order_by(Result.timestamp.desc()).all()
    users = User.query.all()


    for sonuc in all_results:
        sonuc.timestamp = sonuc.timestamp + timedelta(hours=3)

    return render_template('admin.html', users=users, results=all_results)

@app.route('/export_excel')
@login_required
def export_excel():
    if not current_user.is_admin:
        return redirect(url_for('dashboard'))

    
    f_bolum = request.args.get('bolum', '')
    f_yas = request.args.get('yas', '')
    f_cinsiyet = request.args.get('cinsiyet', '')
    f_test = request.args.get('test_type', '')
    f_mod = request.args.get('mod', '')

    query = Result.query.join(User)

    
    if f_bolum: query = query.filter(User.bolum.ilike(f"%{f_bolum}%"))
    if f_yas: query = query.filter(User.yas == int(f_yas))
    if f_cinsiyet: query = query.filter(User.cinsiyet == f_cinsiyet)
    if f_test: query = query.filter(Result.test_type == f_test)
    if f_mod:
        is_analiz = True if f_mod == 'analiz' else False
        query = query.filter(Result.is_analysis_mode == is_analiz)

    results = query.all()
    
    
    data = []
    for r in results:
        data.append({
            "Tarih": (r.timestamp + timedelta(hours=3)).strftime('%d.%m.%Y %H:%M'),
            "Kullanıcı": r.tester.username,
            "Yaş": r.tester.yas,
            "Cinsiyet": r.tester.cinsiyet,
            "Bölüm": r.tester.bolum,
            "Test Türü": r.test_type,
            "Mod": "Analiz" if r.is_analysis_mode else "Antrenman",
            "Puan (%)": r.accuracy_percent,
            "Tepki Süresi (ms)": r.reaction_time_ms
        })

    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Filtreli_Analiz_Verileri')
    output.seek(0)

    return send_file(output, 
                     download_name="ogrenci_analiz_raporu.xlsx", 
                     as_attachment=True)


from flask import jsonify

@app.route('/delete_result/<int:result_id>', methods=['DELETE'])
def delete_result(result_id):
    try:
        
        kayit = Result.query.get(result_id)
        
        if kayit:
            
            db.session.delete(kayit)
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Kayıt silindi.'}), 200
        else:
            return jsonify({'status': 'error', 'message': 'Kayıt bulunamadı.'}), 404
            
    except Exception as e:
        db.session.rollback() 
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
